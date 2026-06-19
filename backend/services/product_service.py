import datetime as dt
from models import generate_uuid
from repositories.product_repository import ProductRepository
from repositories.user_repository import UserRepository
from repositories.bid_repository import BidRepository

class ProductService:
    def __init__(self):
        self.product_repo = ProductRepository()
        self.user_repo = UserRepository()
        self.bid_repo = BidRepository()

    def get_formatted_products(self, main_cat, sub_cat, filter_followed, user_id):
        query = {"status": "ACTIVE"}
        if main_cat and main_cat != 'ALL':
            query["main_category"] = main_cat
        if sub_cat and sub_cat != 'ALL':
            query["sub_category"] = sub_cat
            
        all_products = self.product_repo.find_all(query)
        
        # 尋找熱門賣家
        seller_views = {}
        for p in all_products:
            seller_id = p.get('seller_id')
            seller_views[seller_id] = seller_views.get(seller_id, 0) + p.get('views', 0)
        
        sorted_sellers = sorted(seller_views.items(), key=lambda x: x[1], reverse=True)
        hot_seller_ids = [s[0] for s in sorted_sellers[:2]]
        
        user_following = []
        if filter_followed and user_id:
            user = self.user_repo.find_by_id(user_id)
            if user:
                user_following = user.get("following", [])
                
            filtered_products = []
            for p in all_products:
                # 判斷是否為追蹤者、熱門賣家，或者就是「自己」上架的商品 (修復自己看不到的問題)
                is_following = p.get('seller_id') in user_following
                is_hot_seller = p.get('seller_id') in hot_seller_ids
                is_mine = p.get('seller_id') == user_id
                
                if is_following or is_hot_seller or is_mine:
                    filtered_products.append(p)
            all_products = filtered_products

        hot_products = sorted(all_products, key=lambda x: x.get('views', 0), reverse=True)[:4]
        hot_ids = [p.get('id') for p in hot_products]
        
        latest_products = sorted(
            [p for p in all_products if p.get('id') not in hot_ids], 
            key=lambda x: x.get('created_at', ''), 
            reverse=True
        )
        
        def format_product(p):
            media_urls = p.get('media_urls', [])
            first_img = next((url for url in media_urls if not url.endswith('.mp4')), p.get('image_url', ''))
            return {
                'id': p.get('id'),
                'title': p.get('title'),
                'price': p.get('price') if p.get('type') == 'BUY_NOW' else p.get('current_price'),
                'type': p.get('type'),
                'main_category': p.get('main_category'),
                'sub_category': p.get('sub_category'),
                'image_url': first_img,
                'seller_name': p.get('seller_name'),
                'seller_id': p.get('seller_id'),
                'views': p.get('views', 0)
            }
            
        return {
            'hot_products': [format_product(p) for p in hot_products],
            'latest_products': [format_product(p) for p in latest_products]
        }

    def create_product(self, data):
        seller = self.user_repo.find_by_id(data['seller_id'])
        if not seller:
            return None, "Seller not found"
            
        tier = seller.get('tier', 0)
        p_type = data['type']
        
        if p_type == 'BUY_NOW' and tier < 1:
            return None, "需要升級「買賣」階級才能上架直購商品"
        if p_type == 'BID' and tier < 2:
            return None, "需要升級「買賣競標」階級才能上架競標商品"
            
        media_urls = data.get('media_urls', [])
        if len(media_urls) > 10:
            return None, "Too many media files"
            
        p_id = generate_uuid()
        p = {
            "id": p_id,
            "seller_id": data['seller_id'],
            "seller_name": seller.get('name'),
            "title": data['title'],
            "description": data.get('description', ''),
            "main_category": data['main_category'],
            "sub_category": data['sub_category'],
            "type": p_type,
            "media_urls": media_urls,
            "views": 0,
            "status": "ACTIVE",
            "created_at": dt.datetime.utcnow().isoformat()
        }
        
        if p_type == 'BUY_NOW':
            p['price'] = data['price']
            p['stock'] = data.get('stock', 1)
        else:
            p['start_price'] = data['start_price']
            p['current_price'] = data['start_price']
            p['end_time'] = (dt.datetime.utcnow() + dt.timedelta(days=int(data.get('days', 3)))).isoformat()
            
        self.product_repo.insert(p)
        return p_id, None

    def get_product_details(self, product_id):
        p = self.product_repo.find_by_id(product_id)
        if not p:
            return None
        p['bids'] = self.bid_repo.find_by_product_id(product_id)
        return p

    def update_status(self, product_id, new_status):
        if new_status not in ['ACTIVE', 'INACTIVE', 'DELETED']:
            return False, "Invalid status"
        p = self.product_repo.find_by_id(product_id)
        if not p:
            return False, "Product not found"
        self.product_repo.update_status(product_id, new_status)
        return True, None

    def increment_view(self, product_id):
        self.product_repo.increment_view(product_id)
