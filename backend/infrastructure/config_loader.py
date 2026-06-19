import os
import json

class ConfigLoader:
    _config = None

    @classmethod
    def load(cls):
        if cls._config is None:
            config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.json')
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    cls._config = json.load(f)
            except Exception as e:
                print(f"Error loading config.json: {e}")
                cls._config = {}
        return cls._config

    @classmethod
    def get(cls, section, key=None, default=None):
        config = cls.load()
        sec = config.get(section, {})
        if key:
            return sec.get(key, default)
        return sec
