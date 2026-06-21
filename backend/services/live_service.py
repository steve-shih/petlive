from repositories.live_repository import LiveRepository
from infrastructure.database import Database
from infrastructure.config_loader import ConfigLoader
from datetime import datetime
import json

class LiveService:
    # In-memory mesh tree state: { room_id: { peer_id: { children: [], parent: str|None, layer: int, stats: {} } } }
    MESH_TREES = {}

    def __init__(self):
        self.repo = LiveRepository()
        self.db = Database.get_db() # 為了取得 user，若有 user_repository 應從那邊拿

    def get_live_rooms(self):
        return self.repo.get_live_rooms()

    def get_room(self, room_id):
        room = self.repo.find_room_by_id(room_id)
        if not room:
            return {'error': 'Room not found'}, 404
        return room, 200

    def create_live_room(self, streamer_id, title=None, max_layers=None, layer_capacity=None):
        streamer = self.db.users.find_one({"id": streamer_id})
        if not streamer:
            return {'error': 'User not found'}, 404
            
        tier = streamer.get('tier', 0)
        if tier < 3:
            return {'error': '需要升級「買賣競標直播」階級才能開啟直播'}, 403
            
        addons = streamer.get('addons', [])
        is_high_traffic = "HIGH_TRAFFIC_LIVE" in addons
            
        room_id = self.repo.generate_uuid()
        
        # 讀取設定檔預設值
        def_max_layers = ConfigLoader.get('live', 'default_max_layers', 3)
        def_layer_capacity = ConfigLoader.get('live', 'default_layer_capacity', 4)
        def_total_viewers = ConfigLoader.get('live', 'default_total_viewers', 200)
        def_base_delay = ConfigLoader.get('live', 'default_base_delay', 1000)
        def_layer_delay = ConfigLoader.get('live', 'default_layer_delay', 300)
        def_password = ConfigLoader.get('live', 'default_password', "")
        def_blur_preview = ConfigLoader.get('live', 'default_blur_preview', False)
        def_noise_suppression = ConfigLoader.get('live', 'default_noise_suppression', True)
        def_beauty_filter = ConfigLoader.get('live', 'default_beauty_filter', False)
        def_bg_blur = ConfigLoader.get('live', 'default_bg_blur', False)

        room = {
            "id": room_id,
            "streamer_id": streamer_id,
            "streamer_name": streamer.get('name'),
            "title": title or f"{streamer.get('name')} 的直播間",
            "status": "LIVE",
            "high_traffic": is_high_traffic,
            "max_layers": max_layers if max_layers is not None else def_max_layers,
            "layer_0_capacity": layer_capacity if layer_capacity is not None else def_layer_capacity,
            "layer_n_capacity": layer_capacity if layer_capacity is not None else def_layer_capacity,
            "max_viewers": def_total_viewers,
            "base_delay": def_base_delay,
            "layer_delay": def_layer_delay,
            "password": def_password,
            "blur_preview": def_blur_preview,
            "noise_suppression": def_noise_suppression,
            "beauty_filter": def_beauty_filter,
            "bg_blur": def_bg_blur,
            "created_at": datetime.utcnow().isoformat()
        }
        self.repo.create_room(room)
        room.pop('_id', None)
        return {'message': 'Live room created', 'room': room}, 201

    def end_room(self, room_id):
        self.repo.update_room_status(room_id, 'ENDED')
        return {'message': 'Room ended'}, 200

    def update_room_thumbnail(self, room_id, thumbnail):
        if thumbnail:
            self.repo.update_room_thumbnail(room_id, thumbnail)
        return {'message': 'Thumbnail updated'}, 200

    def update_streamer_peer(self, room_id, peer_id):
        self.repo.update_streamer_peer(room_id, peer_id)
        if room_id not in self.MESH_TREES:
            self.MESH_TREES[room_id] = {}
        self.MESH_TREES[room_id][peer_id] = {"children": [], "parent": None, "layer": 0}
        return {'message': 'Peer ID updated'}, 200

    def get_room_tree(self, room_id):
        if room_id not in self.MESH_TREES:
            return {'error': 'No active tree for this room', 'tree': {}}, 200
        return {'tree': self.MESH_TREES[room_id]}, 200

    def update_room_settings(self, room_id, settings_data):
        room = self.repo.find_room_by_id(room_id)
        if not room:
            return {'error': 'Room not found'}, 404
        
        self.repo.update_room_settings(room_id, settings_data)
        return {'message': 'Settings updated'}, 200

    def report_stats(self, room_id, peer_id, bitrate, ping):
        if room_id in self.MESH_TREES and peer_id in self.MESH_TREES[room_id]:
            self.MESH_TREES[room_id][peer_id]['stats'] = {
                'bitrate': bitrate,
                'ping': ping
            }
        return {'message': 'Stats updated'}, 200

    def join_mesh(self, room_id, viewer_peer_id):
        room = self.repo.find_room_by_id(room_id)
        if not room or room.get('status') == 'ENDED':
            return {"error": "Room not found or ended"}, 404
            
        streamer_peer_id = room.get('streamer_peer_id')
        if not streamer_peer_id:
            return {"error": "Streamer not ready"}, 400
            
        if room_id not in self.MESH_TREES:
            self.MESH_TREES[room_id] = {streamer_peer_id: {"children": [], "parent": None, "layer": 0}}
            
        tree = self.MESH_TREES[room_id]
        
        if viewer_peer_id not in tree:
            tree[viewer_peer_id] = {"children": [], "parent": None, "layer": -1}
            
        queue = [streamer_peer_id]
        parent_id = None
        
        max_layers = room.get('max_layers', 3)
        layer_0_capacity = room.get('layer_0_capacity', 4)
        layer_n_capacity = room.get('layer_n_capacity', 4)
        
        while queue:
            current_id = queue.pop(0)
            node = tree.get(current_id)
            if node:
                cap = layer_0_capacity if node["layer"] == 0 else layer_n_capacity
                if len(node["children"]) < cap and node["layer"] < max_layers:
                    parent_id = current_id
                    break
                queue.extend(node["children"])
                
        if parent_id:
            if viewer_peer_id not in tree[parent_id]["children"]:
                tree[parent_id]["children"].append(viewer_peer_id)
            tree[viewer_peer_id]["parent"] = parent_id
            tree[viewer_peer_id]["layer"] = tree[parent_id]["layer"] + 1
            return {"parent_peer_id": parent_id, "layer": tree[viewer_peer_id]['layer']}, 200
        
        return {"error": "Live room mesh network is at maximum capacity"}, 503

    def report_dead_node(self, room_id, dead_peer_id):
        if room_id in self.MESH_TREES:
            tree = self.MESH_TREES[room_id]
            if dead_peer_id in tree:
                parent_id = tree[dead_peer_id].get("parent")
                if parent_id and parent_id in tree:
                    if dead_peer_id in tree[parent_id]["children"]:
                        tree[parent_id]["children"].remove(dead_peer_id)
                del tree[dead_peer_id]
        return {"message": "Dead node removed from mesh tree"}, 200

    def leave_mesh(self, room_id, peer_id):
        return self.report_dead_node(room_id, peer_id)

    def swap_nodes(self, room_id, node_a, node_b):
        if room_id not in self.MESH_TREES:
            return {'error': 'Tree not found'}, 404
            
        tree = self.MESH_TREES[room_id]
        if node_a not in tree or node_b not in tree:
            return {'error': 'Node not found'}, 404
            
        def is_descendant(parent, target):
            children = tree.get(parent, {}).get('children', [])
            if target in children: return True
            for child in children:
                if is_descendant(child, target): return True
            return False
            
        if is_descendant(node_a, node_b) or is_descendant(node_b, node_a):
            return {'error': 'Cannot swap with a direct descendant'}, 400
            
        parent_a = tree[node_a]['parent']
        parent_b = tree[node_b]['parent']
        
        if parent_a and node_a in tree[parent_a]['children']:
            tree[parent_a]['children'].remove(node_a)
        if parent_b and node_b in tree[parent_b]['children']:
            tree[parent_b]['children'].remove(node_b)
            
        if parent_b:
            tree[parent_b]['children'].append(node_a)
            tree[node_a]['parent'] = parent_b
            tree[node_a]['layer'] = tree[parent_b]['layer'] + 1
            
        if parent_a:
            tree[parent_a]['children'].append(node_b)
            tree[node_b]['parent'] = parent_a
            tree[node_b]['layer'] = tree[parent_a]['layer'] + 1
        
        if parent_b:
            self.repo.create_message({
                "id": self.repo.generate_uuid(),
                "room_id": room_id,
                "sender_id": "SYSTEM",
                "sender_name": "系統",
                "content": json.dumps({"type": "SWAP_PARENT", "target": node_a, "new_parent": parent_b}),
                "created_at": datetime.utcnow().isoformat()
            })
            
        if parent_a:
            self.repo.create_message({
                "id": self.repo.generate_uuid(),
                "room_id": room_id,
                "sender_id": "SYSTEM",
                "sender_name": "系統",
                "content": json.dumps({"type": "SWAP_PARENT", "target": node_b, "new_parent": parent_a}),
                "created_at": datetime.utcnow().isoformat()
            })
            
        return {'message': 'Swap commands dispatched'}, 200

    def kick_user(self, room_id, user_id):
        if not user_id:
            return {'error': 'Missing user_id'}, 400
        self.repo.add_kicked_user(room_id, user_id)
        return {'message': 'User kicked'}, 200

    def get_messages(self, room_id, user_id):
        if not room_id:
            return {'error': 'Missing room_id'}, 400
            
        room = self.repo.find_room_by_id(room_id)
        if room and user_id and user_id in room.get('kicked_users', []):
            return {'error': 'You have been kicked from this room'}, 403

        msgs = self.repo.get_messages(room_id)
        return msgs, 200

    def send_message(self, data):
        sender = self.db.users.find_one({"id": data['sender_id']})
        self.repo.create_message({
            "id": self.repo.generate_uuid(),
            "room_id": data['room_id'],
            "sender_id": data['sender_id'],
            "sender_name": sender.get('name') if sender else 'Unknown',
            "message_text": data['message_text'],
            "created_at": datetime.utcnow().isoformat()
        })
        return {'message': 'Message sent to live room'}, 201

    def verify_password(self, room_id, password):
        room = self.repo.find_room_by_id(room_id)
        if not room:
            return {'error': 'Room not found'}, 404
        if not room.get('password'):
            return {'message': 'No password required'}, 200
        if room.get('password') == password:
            return {'message': 'Password correct'}, 200
        return {'error': 'Incorrect password'}, 403
