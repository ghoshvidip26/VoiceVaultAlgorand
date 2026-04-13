"""
YAML parser for v3labs.yaml configuration files.
"""
import yaml
from typing import Dict, Any
from models.schemas import AgentConfig


def parse_v3labs_yaml(yaml_content: str) -> AgentConfig:
    """
    Parse v3labs.yaml content and return AgentConfig.
    
    Args:
        yaml_content: YAML file content as string
    
    Returns:
        AgentConfig: Parsed and validated agent configuration
    
    Raises:
        ValueError: If YAML is invalid or missing required fields
    """
    try:
        data = yaml.safe_load(yaml_content)
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML format: {str(e)}")
    
    if not isinstance(data, dict):
        raise ValueError("YAML must contain a dictionary")
    
    if "agent" not in data:
        raise ValueError("YAML must contain 'agent' key")
    
    agent_data = data["agent"]
    
    # Validate required fields
    required_fields = ["name", "endpoint"]
    for field in required_fields:
        if field not in agent_data:
            raise ValueError(f"Missing required field: {field}")
    
    # Create and validate AgentConfig
    try:
        return AgentConfig(**agent_data)
    except Exception as e:
        raise ValueError(f"Invalid agent configuration: {str(e)}")
