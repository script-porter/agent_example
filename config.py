from dotenv import load_dotenv
import os


def setup_config() -> None:
    """加载 .env 环境变量配置"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    load_dotenv(dotenv_path=env_path, verbose=True)
