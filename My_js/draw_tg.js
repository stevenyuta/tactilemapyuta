/******************************************************
//線描画を行う機能
******************************************************/

function draw_line(){
  let current_x = 0, current_y = 0;
  let drawing_path;
  draw_mousemove();
  draw_mousedown();
  draw_connectedInitLast();
  if(draw.select('.drawing_path').first()){
    if(draw.select('.drawing_path').first().id() === now_drawing_path_ID){
      drawing_path = draw.select('.drawing_path').first();
      let dpoint = drawing_path.clear().array().settle();
      current_x = dpoint[dpoint.length-1][1];
      current_y = dpoint[dpoint.length-1][2];
      add_closePath_circle();
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
          if(draw.select('.hover_rect.draw_init_rect').first()){
            let connectedPath = SVG.get('#' + draw.select('.hover_rect.draw_init_rect').first().attr('connectedID'));
            if(connectedPath){
              let dpoint = connectedPath.clear().array().settle();
              connectedPath.attr({'d' : ''});
              for(let j = dpoint.length - 1; j >= 0; j--){
                if(j===dpoint.length - 1){
                  connectedPath.M({x : dpoint[j][1] , y : dpoint[j][2]});
                }else{
                  connectedPath.L({x : dpoint[j][1] , y : dpoint[j][2]});
                }
              }
              connectedPath.addClass('drawing_path');
              current_x = dpoint[0][1], current_y = dpoint[0][2];
              add_closePath_circle();
            }
          }else if(draw.select('.hover_rect.draw_last_rect').first()){
            let connectedPath = SVG.get('#' + draw.select('.hover_rect.draw_last_rect').first().attr('connectedID'));
            if(connectedPath){
              let dpoint = connectedPath.clear().array().settle();
              connectedPath.addClass('drawing_path');
              current_x = dpoint[dpoint.length-1][1], current_y = dpoint[dpoint.length-1][2];
              add_closePath_circle();
            }
          }else{
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
          }
        }else{  //書き始めでない場合：drawing_pathクラスをもつ要素がある
          drawing_path = draw.select('.drawing_path').first();
          if(draw.select('.hover_rect.draw_init_rect').first()){
            let connectedPath = SVG.get('#' + draw.select('.hover_rect.draw_init_rect').first().attr('connectedID'));
            if(connectedPath){
              connectedPath_dpoint = connectedPath.clear().array().settle();
              for(let i = 0; i < connectedPath_dpoint.length; i++){
                drawing_path.L({x : connectedPath_dpoint[i][1] , y : connectedPath_dpoint[i][2]});
              }
            }
            connectedPath.remove();
            drawing_path.removeClass('drawing_path');
            draw.select('.draw_close_circle').each(function(i,children){
              this.remove();
            })
          }else if(draw.select('.hover_rect.draw_last_rect').first()){
            let connectedPath = SVG.get('#' + draw.select('.hover_rect.draw_last_rect').first().attr('connectedID'));
            if(connectedPath){
              connectedPath_dpoint = connectedPath.clear().array().settle();
              for(let i = connectedPath_dpoint.length -1; i >= 0; i--){
                drawing_path.L({x : connectedPath_dpoint[i][1] , y : connectedPath_dpoint[i][2]});
              }
              connectedPath.remove();
              drawing_path.removeClass('drawing_path');
              draw.select('.draw_close_circle').each(function(i,children){
                this.remove();
              })
            }
          }else if(draw.select('.hover_circle.draw_close_circle').first()){
            drawing_path.Z().removeClass('drawing_path'); //drawing_pathクラスを排除
            draw.select('.draw_close_circle').each(function(i,children){
              this.remove();
            })
          }else{
            drawing_path.L({x: mx, y: my}); //current_pathに線を描画
            if($('input[name="stroke"]:checked').val()==='dotted_line'){
              drawing_path.attr({ 'stroke-dasharray': PATH_STROKE_WIDTH*$('#StrokeWidth_TextBox').val() })
            }
            draw.select('.edit_circle').front();
            current_x = mx , current_y = my;
            add_closePath_circle();
          }
        }
        draw_connectedInitLast();
        cash_svg();
      }
    })
  }
}

function add_closePath_circle(){
  draw.select('.draw_close_circle').each(function(i,children){
    this.remove();
  })
  if(draw.select('.drawing_path').first()){
    let dpoint = draw.select('.drawing_path').first().clear().array().settle();
    if(dpoint.length >= 3){
      let cx = dpoint[0][1] , cy = dpoint[0][2];
      let closePath_circle = draw.circle().addClass('draw_close_circle').front();
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
}

function draw_end_function(){
  let current_path = draw.select('.drawing_path').first();
  if(current_path){
    current_path.removeClass('drawing_path');
    if(current_path.clear().array().settle().length===1)  current_path.remove();
  }
  add_closePath_circle();
  draw_connectedInitLast();
  dummy_delete();
  now_drawing_path_ID = "";
}

function draw_connectedInitLast(){
  draw.select('.draw_init_rect , .draw_last_rect').each(function(i,children){
    this.remove();
  })
  draw.select('.connected:not(.drawing_path)').each(function(i , children){
    let dpoint = this.clear().array().settle();
    if(dpoint[dpoint.length-1][0] !== "Z"){
      let ix = dpoint[0][1] , iy = dpoint[0][2];
      let lx = dpoint[dpoint.length-1][1] , ly = dpoint[dpoint.length-1][2];
      let draw_init_rect = draw.rect(RECT_WIDTH/(2*draw.viewbox().zoom) , RECT_HEIGHT/(2*draw.viewbox().zoom)).addClass('draw_init_rect').front();
      draw_init_rect.attr({
        'x' : ix - draw_init_rect.width()/2,  'y' : iy - draw_init_rect.width()/2,
        'fill': CIRCLE_COLOR,
        'connectedID' : this.attr('id')
      })
      let draw_last_rect = draw.rect(RECT_WIDTH/(2*draw.viewbox().zoom) , RECT_HEIGHT/(2*draw.viewbox().zoom)).addClass('draw_last_rect').front();
      draw_last_rect.attr({
        'x' : lx - draw_last_rect.width()/2, 'y' : ly - draw_last_rect.height()/2,
        'fill': CIRCLE_COLOR,
        'connectedID' : this.attr('id')
      })
      draw_init_rect.off('mouseover').mouseover(function(e){
        this.attr({ 'fill': CIRCLE_HOVER_COLOR , 'cursor' : 'pointer' }).addClass('hover_rect');
      }).off('mouseout').mouseout(function(e){
        this.attr({ 'fill': CIRCLE_COLOR , 'cursor' : 'default'}).removeClass('hover_rect');
      })
      draw_last_rect.off('mouseover').mouseover(function(e){
        this.attr({ 'fill': CIRCLE_HOVER_COLOR , 'cursor' : 'pointer'}).addClass('hover_rect');
      }).off('mouseout').mouseout(function(e){
        this.attr({ 'fill': CIRCLE_COLOR , 'cursor' : 'default'}).removeClass('hover_rect');
      })
    }
  })
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
