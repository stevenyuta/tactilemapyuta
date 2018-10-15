/******************************************************
//線描画を行う機能
******************************************************/

function draw_line(){
  let current_x = 0, current_y = 0;
  let drawing_path;
  draw_mousemove();
  draw_mousedown();
  if(draw.select('.drawing_path').first()){
    if(draw.select('.drawing_path').first().id() === now_drawing_path_ID){
      drawing_path = draw.select('.drawing_path').first();
      let dpoint = drawing_path.clear().array().settle();
      current_x = dpoint[dpoint.length-1][1];
      current_y = dpoint[dpoint.length-1][2];
      if(dpoint.length > 2)add_closePath_circle(dpoint[0][1] , dpoint[0][2]);
    }else{
      draw.select('.drawing_path').removeClass('drawing_path');
    }
  }

  /***********************************
  //マウスを動かしたときに起動する関数
  ***********************************/
  function draw_mousemove(){
    draw.off('mousemove').mousemove(function(e){
      if(input_key_buffer[17]){ //press ctrl key
        mx = getmousepoint('15degree',e,current_x,current_y).x , my = getmousepoint('15degree',e,current_x,current_y).y;
      }else{
        mx = getmousepoint('connect',e).x , my = getmousepoint('connect',e).y;
      }
      dummy_delete();
      var back_num = getPathCirclePos();
      if(SVG.select('.drawing_path').first()){
        let dummy_path = draw.path().M({x: current_x, y: current_y}).L({x: mx, y: my});
        dummy_path.attr({
          'fill': 'none',
          'stroke' : PATH_STROKE_COLOR,
          'stroke-width' : PATH_STROKE_WIDTH*$('#StrokeWidth_TextBox').val(),
          'stroke-linejoin' : 'round'
        })
        if($('input[name="stroke"]:checked').val()==='dotted_line'){
          dummy_path.attr({
            'stroke-dasharray': PATH_STROKE_WIDTH * $('#StrokeWidth_TextBox').val()
          })
        }
        draw.select('.edit_circle').front();
        dummy_path.addClass('dummy').back();
        for(var i=0; i< back_num; i++){
          dummy_path.forward();
        }
      }
    })
  }

  /*********************************************
  //mousedown時のイベントを設定する関数
  **********************************************/
  function draw_mousedown(){
    draw.off('mousedown').mousedown(function(e){
      if(e.button===0){ //左クリック時
        if($('#StrokeWidth_TextBox').val()==='' || $('#StrokeWidth_TextBox').val()==='0') $('#resetStrokeWidth_Button').click() //StrokeWidth_TextBoxの値が何もない場合はリセットボタンを発火させる
        dummy_delete(); //dummy線を全削除
        var back_num = getPathCirclePos();
        if(!draw.select('.drawing_path').first()){  //書き始めの場合：drawing_pathクラスをもつ要素がない
          drawing_path = draw.path().M({x: mx, y: my}) //pathの描画
          now_drawing_path_ID = drawing_path.id();
          drawing_path.attr({
            'fill': 'none',
            'stroke': PATH_STROKE_COLOR,
            'stroke-width': PATH_STROKE_WIDTH*$('#StrokeWidth_TextBox').val(),
            'stroke-linejoin' : 'round'
          })
          drawing_path.addClass('connected').addClass('SVG_Element').addClass('drawing_path').addClass('path');
          drawing_path.back();
          for(var i=0; i< back_num; i++){
            drawing_path.forward();
          }
          current_x = mx, current_y = my;
        }else{  //書き始めでない場合：drawing_pathクラスをもつ要素がある
          drawing_path = draw.select('.drawing_path').first();
          if(draw.select('.hover_circle').first()){
            drawing_path.Z().removeClass('drawing_path'); //drawing_pathクラスを排除
            circle_delete(); //circleの全削除
          }else{
            drawing_path.L({x: mx, y: my}); //current_pathに線を描画
            if($('input[name="stroke"]:checked').val()==='dotted_line'){
              drawing_path.attr({ 'stroke-dasharray': PATH_STROKE_WIDTH*$('#StrokeWidth_TextBox').val() })
            }
            draw.select('.edit_circle').front();
            if(drawing_path.clear().array().settle().length===3){  //ノード点が3の場合
              circle_delete(); //circleの全削除
              var init_x = drawing_path.array().settle()[0][1] , init_y = drawing_path.array().settle()[0][2];
              add_closePath_circle(init_x , init_y)
            }
            current_x = mx , current_y = my;
          }
        }
        cash_svg();
      }
    })
  }


  function add_closePath_circle(cx , cy){
    let closePath_circle = draw.circle().addClass('edit_circle').front();
    closePath_circle.attr({
      'cx' : cx,
      'cy' : cy,
      'fill': CIRCLE_COLOR,
      'r' : CIRCLE_RADIUS/(2 * draw.viewbox().zoom)
    })
    closePath_circle.mouseover(function(e){
      this.attr({
        'fill': CIRCLE_HOVER_COLOR,
        'cursor':'pointer'
      })
      this.addClass('hover_circle');
    })
    closePath_circle.mouseout(function(e){
      this.attr({
        'fill': CIRCLE_COLOR,
        'cursor': 'default'
      })
      this.removeClass('hover_circle');
    })
  }

}

function draw_end_function(){
  let current_path = draw.select('.drawing_path').first();
  if(current_path){
    current_path.removeClass('drawing_path');
    if(current_path.clear().array().settle().length===1)  current_path.remove();
  }
  circle_delete(); //circleの全削除
  dummy_delete();
  now_drawing_path_ID = "";
}


/**************************************************************************************
//選択状態のpathのstroke-widthを取得してテキストボックスとスライダーの値を変更する関数
//選択状態のpathが存在しない場合は変更なし、または複数存在する場合は空白にする
**********************************************************************************/
function set_strokewidth(){
  if(draw.select('.edit_select').first()!==null){
    var strokewidth_flag = false;  //true: 選択状態のパスあり false: なし
    var strokewidth = false  // strokewidth属性の値を格納、 false: strokewitdhが違うpathが2つ以上ある場合
    draw.select('.edit_select').each(function(i,children){
      if(!this.hasClass('ink') && !this.hasClass('braille')){
        if(!strokewidth_flag){
          strokewidth = this.attr('stroke-width');
          strokewidth_flag = true;
        }else if(strokewidth !== this.attr('stroke-width')){
          strokewidth = false;
        }
      }
    })
    if(strokewidth_flag){
      if(strokewidth===false){
        $('#StrokeWidth_TextBox').val('')
      }else{
        $("#StrokeWidth_Slider").slider("value",Math.round(strokewidth/ SVG_RATIO * 10)/10);
        $('#StrokeWidth_TextBox').val(Math.round(strokewidth/ SVG_RATIO * 10)/10)
      }
    }
  }
}
