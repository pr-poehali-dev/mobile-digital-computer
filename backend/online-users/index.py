"""
Business: Управление онлайн-пользователями и сменами диспетчеров
Args: event с httpMethod, path, body, queryStringParameters
Returns: HTTP response с данными онлайн-пользователей или смен
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Получение подключения к БД"""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not set')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    resource = params.get('resource', 'users')  # 'users' или 'shifts'
    
    # CORS preflight
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
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # ===== ОНЛАЙН ПОЛЬЗОВАТЕЛИ =====
        if resource == 'users':
            # GET - получить всех онлайн пользователей
            if method == 'GET':
                cutoff_time = datetime.now() - timedelta(seconds=10)
                cur.execute(
                    "DELETE FROM online_users WHERE last_heartbeat < %s",
                    (cutoff_time,)
                )
                conn.commit()
                
                cur.execute("""
                    SELECT user_id, full_name, role, email, last_heartbeat
                    FROM online_users
                    ORDER BY last_heartbeat DESC
                """)
                users = cur.fetchall()
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps([dict(u) for u in users], default=str),
                    'isBase64Encoded': False
                }
            
            # POST - добавить/обновить пользователя (heartbeat)
            if method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                user_id = body_data.get('user_id')
                full_name = body_data.get('full_name')
                role = body_data.get('role')
                email = body_data.get('email')
                
                if not all([user_id, full_name, role, email]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO online_users (user_id, full_name, role, email, last_heartbeat)
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        full_name = EXCLUDED.full_name,
                        role = EXCLUDED.role,
                        email = EXCLUDED.email,
                        last_heartbeat = CURRENT_TIMESTAMP
                    RETURNING user_id, full_name, role, email, last_heartbeat
                """, (user_id, full_name, role, email))
                
                result = cur.fetchone()
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(dict(result), default=str),
                    'isBase64Encoded': False
                }
            
            # DELETE - удалить пользователя
            if method == 'DELETE':
                user_id = params.get('userId')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'userId required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("DELETE FROM online_users WHERE user_id = %s", (user_id,))
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        # ===== СМЕНЫ ДИСПЕТЧЕРОВ =====
        if resource == 'shifts':
            # GET - получить активные смены
            if method == 'GET':
                cur.execute("""
                    SELECT id, dispatcher_id, dispatcher_name, start_time, is_active
                    FROM dispatcher_shifts
                    WHERE is_active = TRUE
                    ORDER BY start_time DESC
                """)
                shifts = cur.fetchall()
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps([dict(s) for s in shifts], default=str),
                    'isBase64Encoded': False
                }
            
            # POST - начать смену
            if method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                dispatcher_id = body_data.get('dispatcher_id')
                dispatcher_name = body_data.get('dispatcher_name')
                
                if not all([dispatcher_id, dispatcher_name]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем, есть ли уже активная смена
                cur.execute("""
                    SELECT id FROM dispatcher_shifts
                    WHERE dispatcher_id = %s AND is_active = TRUE
                """, (dispatcher_id,))
                
                existing = cur.fetchone()
                
                if existing:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'message': 'Already on duty'}),
                        'isBase64Encoded': False
                    }
                
                # Создаем новую смену
                cur.execute("""
                    INSERT INTO dispatcher_shifts (dispatcher_id, dispatcher_name, is_active)
                    VALUES (%s, %s, TRUE)
                    RETURNING id, dispatcher_id, dispatcher_name, start_time, is_active
                """, (dispatcher_id, dispatcher_name))
                
                result = cur.fetchone()
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(dict(result), default=str),
                    'isBase64Encoded': False
                }
            
            # DELETE - завершить смену
            if method == 'DELETE':
                dispatcher_id = params.get('dispatcherId')
                
                if not dispatcher_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'dispatcherId required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE dispatcher_shifts
                    SET is_active = FALSE, end_time = CURRENT_TIMESTAMP
                    WHERE dispatcher_id = %s AND is_active = TRUE
                """, (dispatcher_id,))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
