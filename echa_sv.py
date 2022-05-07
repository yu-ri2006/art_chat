from flask import Flask, request, render_template, redirect, jsonify
import urllib.parse
import time

app = Flask(__name__)
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

#保管用辞書配列
board_data_list = {}
board_time_data_list = {}

@app.route('/send', methods=["GET", "POST"])
def send_json():
    global board_data_list
    global board_time_data_list

    room_id = request.args.get("room_id")
    json_data = request.form["json_data"]
    room_last_update_time = request.form["room_last_update_time"]
    
    #配列に登録
    board_data_list[room_id] = json_data;
    board_time_data_list[room_id] = room_last_update_time;
    print(f"send_json: {room_id}, {json_data}")

    return jsonify({'status':'True', 'room_id':room_id})

@app.route('/get_json')
def get_json():
    global board_data_list
    global board_time_data_list

    if request.args.get("room_id") in board_data_list:
        room_id = request.args.get("room_id")
        json_data = board_data_list[room_id]
        room_last_update_time = board_time_data_list[room_id]
        
        print(f"get_json: [{room_id}]{room_last_update_time}, {json_data}")

        return jsonify({'status':'True', 'room_id':room_id,'room_last_update_time':room_last_update_time , 'json_data':json_data})
    else:
        return jsonify({'status':'False', 'room_id':request.args.get("room_id")})


if __name__ == "__main__":
    app.run(port=80,debug=True)