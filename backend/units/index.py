import json
import os
import psycopg2
import psycopg2.extras
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления юнитами (экипажами) и их участниками
    Args: event с httpMethod, body, queryStringParameters
    Returns: JSON с данными юнитов
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
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    schema = 't_p48049793_mobile_digital_compu'
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'DB connection error: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    try:
        if method == 'GET':
            cur.execute(f'''
                SELECT u.id, u.unit_name, u.status, u.location, u.last_update,
                       COALESCE(json_agg(um.member_name) FILTER (WHERE um.member_name IS NOT NULL), '[]') as members
                FROM {schema}.units u
                LEFT JOIN {schema}.unit_members um ON u.id = um.unit_id
                GROUP BY u.id, u.unit_name, u.status, u.location, u.last_update
                ORDER BY u.id
            ''')
            
            units = []
            for row in cur.fetchall():
                units.append({
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
                'body': json.dumps({'units': units}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            unit_name = body.get('unitName', '').replace("'", "''")
            status = body.get('status', 'available')
            location = body.get('location', '').replace("'", "''")
            members = body.get('members', [])
            now = datetime.now().isoformat()
            
            cur.execute(f"INSERT INTO {schema}.units (unit_name, status, location, last_update) VALUES ('{unit_name}', '{status}', '{location}', '{now}') RETURNING id")
            unit_id = cur.fetchone()['id']
            
            for member in members:
                member_safe = member.replace("'", "''")
                cur.execute(f"INSERT INTO {schema}.unit_members (unit_id, member_name) VALUES ({unit_id}, '{member_safe}')")
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': unit_id, 'message': 'Юнит создан'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            unit_id = body.get('id')
            now = datetime.now().isoformat()
            
            if body.get('status'):
                cur.execute(f"UPDATE {schema}.units SET status = '{body['status']}', last_update = '{now}' WHERE id = {unit_id}")
            
            if body.get('location'):
                location_safe = body['location'].replace("'", "''")
                cur.execute(f"UPDATE {schema}.units SET location = '{location_safe}', last_update = '{now}' WHERE id = {unit_id}")
            
            if 'members' in body:
                cur.execute(f'DELETE FROM {schema}.unit_members WHERE unit_id = {unit_id}')
                for member in body['members']:
                    member_safe = member.replace("'", "''")
                    cur.execute(f"INSERT INTO {schema}.unit_members (unit_id, member_name) VALUES ({unit_id}, '{member_safe}')")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Юнит обновлён'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            unit_id = params.get('id')
            
            cur.execute(f'DELETE FROM {schema}.unit_members WHERE unit_id = {unit_id}')
            cur.execute(f'DELETE FROM {schema}.units WHERE id = {unit_id}')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Юнит удалён'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'}),
        'isBase64Encoded': False
    }