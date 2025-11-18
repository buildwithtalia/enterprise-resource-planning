#!/usr/bin/env python3
"""
Script to parse Postman collection and extract all routes
"""
import json

def extract_routes(item, parent_path="", routes=None):
    """Recursively extract routes from collection items"""
    if routes is None:
        routes = []
    
    for entry in item:
        if 'request' in entry:
            # This is a request
            request = entry['request']
            method = request.get('method', 'GET')
            
            # Extract path from URL
            url = request.get('url', {})
            if isinstance(url, str):
                path = url.replace('{{baseUrl}}', '')
            else:
                path_parts = url.get('path', [])
                path = '/' + '/'.join(path_parts) if path_parts else ''
            
            # Get request body if exists
            body = None
            if 'body' in request:
                body_mode = request['body'].get('mode')
                if body_mode == 'raw':
                    body = request['body'].get('raw', '')
            
            routes.append({
                'name': entry.get('name', ''),
                'method': method,
                'path': path,
                'body': body,
                'description': entry.get('request', {}).get('description', '')
            })
        
        if 'item' in entry:
            # This is a folder, recurse
            extract_routes(entry['item'], parent_path, routes)
    
    return routes

def main():
    collection_path = '/Users/talia.kohan@postman.com/Postman/enterprise-resource-planning/postman/collections/Enterprise Resource Planning API.postman_collection.json'
    
    with open(collection_path, 'r') as f:
        collection = json.load(f)
    
    routes = extract_routes(collection['item'])
    
    # Print routes grouped by module
    current_module = None
    for route in routes:
        path = route['path']
        if path.startswith('/api/'):
            module = path.split('/')[2] if len(path.split('/')) > 2 else 'root'
        elif path.startswith('/health') or path.startswith('/api'):
            module = 'system'
        else:
            module = 'other'
        
        if module != current_module:
            print(f"\n## {module.upper()}")
            current_module = module
        
        print(f"{route['method']:6} {route['path']:50} # {route['name']}")

if __name__ == '__main__':
    main()
