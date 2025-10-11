import json
import os
import psycopg2
import psycopg2.extras
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления экипажами и их участниками
    Args: event с httpMethod, body, queryStringParameters
    Returns: JSON с данными экипажей
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    schema = 't_p48049793_mobile_digital_compu'
    
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        if method == 'GET':
            cur.execute(f'''
                SELECT c.id, c.unit_name, c.status, c.location, c.last_update,
                       COALESCE(json_agg(cm.member_name) FILTER (WHERE cm.member_name IS NOT NULL), '[]') as members
                FROM {schema}.crews c
                LEFT JOIN {schema}.crew_members cm ON c.id = cm.crew_id
                GROUP BY c.id, c.unit_name, c.status, c.location, c.last_update
                ORDER BY c.id
            ''')
            
            crews = []
            for row in cur.fetchall():
                crews.append({
                    'id': row['id'],
                    'unitName': row['unit_name'],
                    'status': row['status'],
                    'location': row['location'],
                    'lastUpdate': row['last_update'].isoformat() if row['last_update'] else None,
                    'members': json.loads(row['members']) if isinstance(row['members'], str) else row['members']
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'crews': crews})
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            unit_name = body.get('unitName', '').replace("'", "''")
            status = body.get('status', 'available')
            location = body.get('location', '').replace("'", "''")
            members = body.get('members', [])
            now = datetime.now().isoformat()
            
            cur.execute(f"INSERT INTO {schema}.crews (unit_name, status, location, last_update) VALUES ('{unit_name}', '{status}', '{location}', '{now}') RETURNING id")
            crew_id = cur.fetchone()['id']
            
            for member in members:
                member_safe = member.replace("'", "''")
                cur.execute(f"INSERT INTO {schema}.crew_members (crew_id, member_name) VALUES ({crew_id}, '{member_safe}')")
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': crew_id, 'message': 'Экипаж создан'})
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            crew_id = body.get('id')
            now = datetime.now().isoformat()
            
            if body.get('status'):
                cur.execute(f"UPDATE {schema}.crews SET status = '{body['status']}', last_update = '{now}' WHERE id = {crew_id}")
            
            if body.get('location'):
                location_safe = body['location'].replace("'", "''")
                cur.execute(f"UPDATE {schema}.crews SET location = '{location_safe}', last_update = '{now}' WHERE id = {crew_id}")
            
            if 'members' in body:
                cur.execute(f'DELETE FROM {schema}.crew_members WHERE crew_id = {crew_id}')
                for member in body['members']:
                    member_safe = member.replace("'", "''")
                    cur.execute(f"INSERT INTO {schema}.crew_members (crew_id, member_name) VALUES ({crew_id}, '{member_safe}')")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Экипаж обновлён'})
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            crew_id = params.get('id')
            
            cur.execute(f'DELETE FROM {schema}.crew_members WHERE crew_id = {crew_id}')
            cur.execute(f'DELETE FROM {schema}.crews WHERE id = {crew_id}')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Экипаж удалён'})
            }
    
    finally:
        cur.close()
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }
