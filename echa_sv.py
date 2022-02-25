from flask import Flask, request, render_template, redirect, jsonify
import urllib.parse

app = Flask(__name__)
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

#保管用辞書配列
board_data_list = {}

@app.route('/send', methods=["GET", "POST"])
def send_json():
    global board_data_list

    room_id = request.args.get("room_id")
    json_data = request.form["json_data"]
    
    #配列に登録
    board_data_list[room_id] = json_data;
    print(f"send_json: {room_id}, {json_data}")

    return jsonify({'status':'OK', 'room_id':room_id})

@app.route('/get_json')
def get_json():
    global board_data_list

    room_id = request.args.get("room_id")
    json_data = board_data_list[room_id]
    print(f"get_json: {room_id}, {json_data}")

    return jsonify({'status':'OK', 'room_id':room_id, 'json_data':json_data})


if __name__ == "__main__":
    app.run(port=80,debug=True)