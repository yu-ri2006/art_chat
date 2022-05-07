/*===============================
  room の管理コード　ここから
===============================*/
//room idチェック
var url = new URL(window.location.href);
var params = url.searchParams;
const room_id = params.get("room_id");

if(room_id == null){
  alert("ルームIDが指定されていません");
  location.href = "index.html";
}
/*===============================
room の管理コード　ここまで
===============================*/


/*===============================
room作成(空json送信)
===============================*/
$.ajax({
  url: "http://127.0.0.1/get_json?room_id=" + room_id,
  type: 'GET',
  dataType: "json",
  }).done(function (data) {
      console.log(JSON.stringify(data, null, 2));
      if(data["status"] == "False"){
        console.log("create room(id:" + room_id + ")");
        $.ajax({
          url: "http://127.0.0.1/send?room_id=" + room_id,
          data: {"json_data" : "",
                    "room_last_update_time" : Date.now()},
          type: 'POST',
          dataType: "json",
          }).done(function (data) {
              console.log(JSON.stringify(data, null, 2));
          }).fail(function (data) {
          // error
        });
      }
  }).fail(function (data) {
  // error
});



document.addEventListener('DOMContentLoaded', function () {
  //選択表示
  var old_sel = null;

  function SelectedButton() {
    if(old_sel != this.id){
      console.log("click_button : " + this.id);

      //selectedを消し去る
      var elems = document.querySelectorAll('.select_button_tips');
      for (var i = 0; i < elems.length; i++){
        elems[i].classList.remove("selected");
      }
      //押されたのに追加しちゃ
      this.classList.add("selected");
      old_sel = this.id;
    }
  }

  //全ての要素を監視
  var elems = document.querySelectorAll('.select_button_tips');
  for (var i = 0; i < elems.length; i++){
    elems[i].addEventListener('click', SelectedButton, false);
  }


  const CANVAS_WIDTH = 2000;
  const CANVAS_HEIGHT = 2000;

  let lastSelectdColorBtn = document.getElementById("black");

  let lockHistory = false;//Undo/Redo時の描画イベントに反応させないためのフラグ
  const undo_history = [];
  const redo_history = [];

  var draw_color = "#000";//初期色
  var line_size = 5;//初期サイズ

  const canvas = new fabric.Canvas("canvas", {
    freeDrawingCursor: 'none',//自作のドットカーソルを表示するために必要
    isDrawingMode: true
  });
  canvas.setHeight(CANVAS_HEIGHT);
  canvas.setWidth(CANVAS_WIDTH);
  canvas.setBackgroundColor(
    "rgba(255, 255, 255, 1)",
    canvas.renderAll.bind(canvas)
  );

  var first_update = false;

  //canvas送信
  function send_json() {
    console.log("send_canvas : " + JSON.stringify(canvas));
    $.ajax({
      url: "http://127.0.0.1/send?room_id=" + room_id,
      data: {"json_data" : JSON.stringify(canvas),
                "room_last_update_time" : Date.now()},
      type: 'POST',
      dataType: "json",
      }).done(function (data) {
          console.log(JSON.stringify(data, null, 2));
      }).fail(function (data) {
      // error
    });
  }

  //canvas受信 && canvas描画
  function get_json(){
    $.ajax({
      url: "http://127.0.0.1/get_json?room_id=" + room_id,
      type: 'GET',
      dataType: "json",
      }).done(function (data) {
          console.log(JSON.stringify(data, null, 2));
          if(data["status"] == "True"){
            //比較用に現在時刻を取得
            if(data["room_last_update_time"] < Date.now()){
              canvas.loadFromJSON(data["json_data"]).renderAll();

              //フラグを変更
              first_update = true;
            }
          }
      }).fail(function (data) {
      // error
    });
  }

  //初回実行
  get_json();


  //オブジェクト選択時のハンドルを太くする
  fabric.Object.prototype.set({
    borderColor: "rgb(255, 191, 95)",//選択枠の色
    borderScaleFactor: 3,//選択枠の太さ
    cornerSize: 10,//コーナーハンドルのサイズ
    cornerColor: "rgba(0, 0, 0, 0.5)",//コーナーハンドルの色
    transparentCorners: false,//コーナーハンドルの不透明同
    cornerStrokeColor: "rgba(255, 191, 95)",//コーナーハンドルの輪郭の色
    cornerStyle: "circle"//コーナーハンドルの形（circle or rect）
  });

  // canvas.isDrawingMode = true; // お絵かきモードの有効化
  canvas.freeDrawingBrush.color = draw_color;
  canvas.freeDrawingBrush.width = line_size;

  undo_history.push(JSON.stringify(canvas));//とりあえず最初の状態をUNDOバッファに記録

  //色選択ボタンの設定
  function color_change(){
    //colorを取得
    draw_color = document.getElementById("color-input").value;
    console.log("Change_color : " + draw_color);

    canvas.freeDrawingBrush.color = draw_color; // 描画する線の色

      cursor.style.setProperty("background", draw_color);//ドットカーソルの色を変更

      //描画モードに変更
      canvas.isDrawingMode = true;
      canvas.discardActiveObject();
      canvas.requestRenderAll();

  }
  let color_element = document.getElementById("color-input");
  color_element.addEventListener("change", color_change);

  //ペンのサイズとか
  function line_size_change(){
    //サイズを取得
    line_size = document.getElementById("line_size").value;
    console.log("Change_size : " + line_size);

    //ボタンが自分の値を取得してペンサイズにセット
    canvas.freeDrawingBrush.width = parseInt(line_size);

    //ドットカーソルのサイズを変更
    cursor.style.setProperty("--cursor-size", line_size + "px");
    cursor.style.setProperty("--cursor-offset", -parseInt(line_size) / 2 + "px");

    clearSelectedButton();
    lastSelectdColorBtn.classList.add("selected");

    //描画モードに変更
    canvas.isDrawingMode = true;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }
  let line_size_element = document.getElementById("line_size");
  line_size_element.addEventListener("change", line_size_change);


  //カーソル用のdivの位置をマウスに追従させる
  document.addEventListener("mousemove", function (e) {
    cursor.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    // "translate(" + e.clientX + "px, " + e.clientY + "px)";
  });


  //canvas内でドットカーソルを表示
  document.getElementById("canvas-container").addEventListener("mouseover", function (e) {
    console.log("canvas over");
    document.getElementById("cursor").classList.add("showDotCursor");
    document.getElementById("cursor").classList.remove("hideDotCursor");
  });

  //canvas外でドットカーソルを消す
  document.getElementById("canvas-container").addEventListener("mouseout", function (e) {
    console.log("canvas out");
    document.getElementById("cursor").classList.add("hideDotCursor");
    document.getElementById("cursor").classList.remove("showDotCursor");
  });


  //ダウンロードの処理
  document.getElementById("download-button").addEventListener("click", function (e) {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    let canvasToDL = document.getElementById("canvas");
    let link = document.createElement("a");
    link.href = canvasToDL.toDataURL("image/png");
    link.download = "drawing.png";
    link.click();
  });

  //消しゴムの処理
  document.getElementById("eraser-button")
    .addEventListener("click", function (e) {
      //色とサイズを変更
      canvas.freeDrawingBrush.width = parseInt(line_size);
      canvas.freeDrawingBrush.color = "#fff";
      //ドットカーソルのサイズを変更
      cursor.style.setProperty("--cursor-size", line_size + "px");
      cursor.style.setProperty("--cursor-offset", -parseInt(line_size) / 2 + "px");
      //描画モードに変更
      canvas.isDrawingMode = true;
      canvas.discardActiveObject();
      canvas.requestRenderAll();

    });

    //ペンツールのそれ
    document.getElementById("pen-button")
    .addEventListener("click", function (e) {
      //色とサイズを変更
      canvas.freeDrawingBrush.width = parseInt(line_size);
      canvas.freeDrawingBrush.color = draw_color;
      //ドットカーソルのサイズを変更
      cursor.style.setProperty("--cursor-size", line_size + "px");
      cursor.style.setProperty("--cursor-offset", -parseInt(line_size) / 2 + "px");
      //描画モードに変更
      canvas.isDrawingMode = true;
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    });

  //全消去の処理
  document.getElementById("clear-button").addEventListener("click", () => {
    canvas.clear();
    canvas.setBackgroundColor(
      "rgba(255, 255, 255, 1)",
      canvas.renderAll.bind(canvas)
    );
    undo_history.push(JSON.stringify(canvas));//UNDO処理
    undoBtn.removeAttribute("disabled");

  });

  //編集モードボタンの処理
  document.getElementById("move-button").addEventListener("mouseup", function (e) {
    if (canvas.isDrawingMode) {
      canvas.isDrawingMode = false;
    }

  });

  //deleteボタンの処理
  const deleteBtn = document.getElementById("object-delete-button");

  //オブジェクトが選択された時だけdeleteボタンを有効にする
  canvas.on("selection:created", function () {
    deleteBtn.removeAttribute("disabled");
  });
  canvas.on("selection:cleared", function () {
    deleteBtn.setAttribute("disabled", true);
  });

  deleteBtn.addEventListener("click", function () {
    deleteSelectedObjects();
  });

  function deleteSelectedObjects() {
    lockHistory = true;
    canvas.getActiveObjects().forEach(element => {
      canvas.remove(element);
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    undo_history.push(JSON.stringify(canvas));//UNDO処理
    undoBtn.removeAttribute("disabled");
    lockHistory = false;
  }

  //キーボードでオブジェクトを消去
  document.addEventListener("keyup", function (e) {
    console.log(e.keyCode);
    if (e.keyCode == 8 | e.keyCode == 46) {
      deleteSelectedObjects();
    }
  });

  //テキストエリアなどの編集しているときにdeleteキーが誤動作するのを防ぐ
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#canvas-container')) {
      //ここに外側をクリックしたときの処理
      console.log("OUTSIDE!");
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    } else {
      //ここに内側をクリックしたときの処理
      console.log("inside!");

      send_json();
    }
  });

  const undoBtn = document.getElementById("undo-button");
  undoBtn.addEventListener('click', undo);
  const redoBtn = document.getElementById("redo-button");
  redoBtn.addEventListener('click', redo);


  canvas.on('object:added', function () {
    if (lockHistory) return;
    console.log('object:added');
    undo_history.push(JSON.stringify(canvas));
    undoBtn.removeAttribute("disabled");
    redo_history.length = 0;
    redoBtn.setAttribute("disabled", true);
    console.log(undo_history.length);
  });

  canvas.on('object:modified', function () {
    if (lockHistory) return;
    console.log('object:modified');
    undo_history.push(JSON.stringify(canvas));
    undoBtn.removeAttribute("disabled");
    redo_history.length = 0;
    redoBtn.setAttribute("disabled", true);
    console.log(undo_history.length);
  });

  canvas.on('object:removed', function () {
    if (lockHistory) return;
    console.log('object:removed');
    undo_history.push(JSON.stringify(canvas));
    undoBtn.removeAttribute("disabled");
    redo_history.length = 0;
    redoBtn.setAttribute("disabled", true);
    console.log(undo_history.length);
  });

  function undo() {
    if (undo_history.length > 0) {
      lockHistory = true;
      if (undo_history.length > 1) {//最初の白紙はredoに入れない
        redo_history.push(undo_history.pop());
        redoBtn.removeAttribute("disabled");
        if (undo_history.length === 1) undoBtn.setAttribute("disabled", true);
      }
      const content = undo_history[undo_history.length - 1];
      canvas.loadFromJSON(content, function () {
        canvas.renderAll();
        lockHistory = false;
      });
    }
  }

  function redo() {
    if (redo_history.length > 0) {
      lockHistory = true;
      const content = redo_history.pop();
      if (redo_history.length === 0) redoBtn.setAttribute("disabled", true);
      undo_history.push(content);
      undoBtn.removeAttribute("disabled");
      canvas.loadFromJSON(content, function () {
        canvas.renderAll();
        lockHistory = false;
      });
    }
  }
  
});

