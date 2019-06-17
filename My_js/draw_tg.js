/******************************************************
//線描画を行う機能
******************************************************/

function draw_line(){
  let current_x = 0, current_y = 0;
  let drawing_path;
  draw_mousemove();
  draw_mousedown();
  set_InitLastNode();
  if(draw.select('.drawing_path').first()){
    if(draw.select('.drawing_path').first().id() === now_drawing_path_ID){
      drawing_path = draw.select('.drawing_path').first();
      let dpoint = drawing_path.clear().array().settle();
      current_x = dpoint[dpoint.length-1][1];
      current_y = dpoint[dpoint.length-1][2];
      drawing_path_dpoint="";
      for(let i=0; i < dpoint.length; i++){
        drawing_path_dpoint += dpoint[i][0] +" "+ dpoint[i][1] + " " + dpoint[i][2];
      }
      set_closePathNode();
    }else{
      draw.select('.drawing_path').removeClass('drawing_path');
    }
  }

  /***********************************
  //マウスを動かしたときに起動する関数
  ***********************************/
  function draw_mousemove(){
    draw.off('mousemove').mousemove(function(e){
      if(input_key_buffer[16] || input_key_buffer[17]){ //ctrlキーを押しているとき
        mx = getmousepoint('15degree',e,current_x,current_y).x , my = getmousepoint('15degree',e,current_x,current_y).y;
      }else{
        mx = getmousepoint('connect',e).x , my = getmousepoint('connect',e).y;
      }
      if(draw.select('.drawing_path').first())draw.select('.drawing_path').first().attr({'d' : drawing_path_dpoint + 'L ' + mx +' '+ my});
    })
  }

  /*********************************************
  //マウスクリック時のイベントを設定する関数
  **********************************************/
  function draw_mousedown(){
    draw.off('mousedown').mousedown(function(e){
      if(e.button===0){ //左クリック時
        //StrokeWidth_TextBoxの値が何もないまたは0の場合はリセットボタンを発火させる
        if($('#StrokeWidth_TextBox').val()==='') $('#resetStrokeWidth_Button').click();
        if($('#StrokeWidth_TextBox').val()==='0' && $('input[name="draw_line_fillRadio"]:checked').val()==='none') $('#resetStrokeWidth_Button').click();
        let position_num = getPathCirclePos();
        if(!draw.select('.drawing_path').first()){  //書き始めの場合：drawing_pathクラスをもつ要素がない
          if(draw.select('.hovering_node.init_node').first()){ //他のpathの始点ノードのホバー時
            let connectedPath = SVG.get(draw.select('.hovering_node.init_node').first().attr('connectedID'));
            let dpoint = connectedPath.clear().array().settle();
            connectedPath.attr({'d' : ''}).addClass('drawing_path');
            drawing_path_dpoint="";
            for(let j = dpoint.length - 1; j >= 0; j--){
              if(j===dpoint.length - 1){
                connectedPath.M({x : dpoint[j][1] , y : dpoint[j][2]});
                drawing_path_dpoint += "M "+ dpoint[j][1] + " " + dpoint[j][2];
              }else{
                connectedPath.L({x : dpoint[j][1] , y : dpoint[j][2]});
                drawing_path_dpoint += "L "+ dpoint[j][1] + " " + dpoint[j][2];
              }
            }
            now_drawing_path_ID = connectedPath.id();
            current_x = dpoint[0][1], current_y = dpoint[0][2];
            set_closePathNode();
          }else if(draw.select('.hovering_node.last_node').first()){ //他のpathの終点ノードのホバー時
            let connectedPath = SVG.get(draw.select('.hovering_node.last_node').first().attr('connectedID'));
            let dpoint = connectedPath.clear().array().settle();
            connectedPath.addClass('drawing_path');
            now_drawing_path_ID = connectedPath.id();
            current_x = dpoint[dpoint.length-1][1], current_y = dpoint[dpoint.length-1][2];
            /*現在のdrawing_pathのd属性情報を記憶*/
            drawing_path_dpoint="";
            for(let i=0; i < dpoint.length; i++){
              drawing_path_dpoint += dpoint[i][0] +" "+ dpoint[i][1] + " " + dpoint[i][2];
            }
            set_closePathNode();
          }else{ //ノードをホバーしていない場合
            drawing_path = draw.path().M({x: mx, y: my}) //pathの描画
            now_drawing_path_ID = drawing_path.id();
            drawing_path.attr({
              'fill': $('input[name="draw_line_fillRadio"]:checked').val(),
              'stroke': $('#stroke_color').val(),
              'stroke-width': PS_WIDTH*$('#StrokeWidth_TextBox').val()
            })
            if($('input[name="draw_line_fillRadio"]:checked').val()==='custom') drawing_path.fill($('#draw_fill_color').val());
            if($('input[name="stroke"]:checked').attr('id')==='dotted_line'){
              drawing_path.attr({ 'stroke-dasharray': PS_WIDTH*$('#StrokeWidth_TextBox').val() })
            }
            drawing_path.addClass('connected').addClass('SVG_Element').addClass('drawing_path').addClass('path');
            drawing_path.back();
            for(var i=0; i< position_num; i++) drawing_path.forward();
            current_x = mx, current_y = my;
            /*現在のdrawing_pathのd属性情報を記憶*/
            drawing_path_dpoint="";
            let dp_dpoint = drawing_path.clear().array().settle();
            for(let i=0; i < dp_dpoint.length; i++){
              drawing_path_dpoint += dp_dpoint[i][0] +" "+ dp_dpoint[i][1] + " " + dp_dpoint[i][2];
            }
          }
        }else{  //書き始めでない場合：drawing_pathクラスをもつ要素がある
          drawing_path = draw.select('.drawing_path').first();
          drawing_path.attr({'d' : drawing_path_dpoint});
          drawing_path_dpoint="";
          if(draw.select('.hovering_node.init_node').first()){
            let connectedPath = SVG.get(draw.select('.hovering_node.init_node').first().attr('connectedID'));
            connectedPath_dpoint = connectedPath.clear().array().settle();
            for(let i = 0; i < connectedPath_dpoint.length; i++){
              drawing_path.L({x : connectedPath_dpoint[i][1] , y : connectedPath_dpoint[i][2]});
            }
            connectedPath.remove();
            drawing_path.removeClass('drawing_path');
            draw.select('.close_node').each(function(i,children){
              this.remove();
            })
          }else if(draw.select('.hovering_node.last_node').first()){
            let connectedPath = SVG.get('#' + draw.select('.hovering_node.last_node').first().attr('connectedID'));
            connectedPath_dpoint = connectedPath.clear().array().settle();
            for(let i = connectedPath_dpoint.length -1; i >= 0; i--){
              drawing_path.L({x : connectedPath_dpoint[i][1] , y : connectedPath_dpoint[i][2]});
            }
            connectedPath.remove();
            drawing_path.removeClass('drawing_path');
            draw.select('.close_node').each(function(i,children){
              this.remove();
            })
          }else if(draw.select('.hovering_node.close_node').first()){
            drawing_path.Z().removeClass('drawing_path'); //drawing_pathクラスを排除
            draw.select('.close_node').each(function(i,children){
              this.remove();
            })
          }else{
            drawing_path.L({x: mx, y: my}); //current_pathに線を描画
            current_x = mx , current_y = my;
            /*現在のdrawing_pathのd属性情報を記憶*/
            let dp_dpoint = drawing_path.clear().array().settle();
            for(let i=0; i < dp_dpoint.length; i++){
              drawing_path_dpoint += dp_dpoint[i][0] +" "+ dp_dpoint[i][1] + " " + dp_dpoint[i][2];
            }
            set_closePathNode();
          }
        }
        set_InitLastNode();
        cash_svg();
      }
    })
  }
}

function set_closePathNode(){
  draw.select('.close_node').each(function(i,children){
    this.remove();
  })
  if(draw.select('.drawing_path').first()){
    let dpoint = draw.select('.drawing_path').first().clear().array().settle();
    if(dpoint.length >= 3){
      let ix = dpoint[0][1] , iy = dpoint[0][2];
      let closePath_rect = draw.rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('close_node').front();
      closePath_rect.attr({
        'x' : ix - closePath_rect.width()/2,  'y' : iy - closePath_rect.width()/2,
        'fill': '#6495ED'
      })
      closePath_rect.mouseover(function(e){
        this.attr({ 'fill': DRAW_HOVER_COLOR,  'cursor':'pointer' });
        this.addClass('hovering_node');
      })
      closePath_rect.mouseout(function(e){
        this.attr({ 'fill': '#6495ED',  'cursor': 'default' });
        this.removeClass('hovering_node');
      })
    }
  }
}

function draw_end_function(){
  let current_path = draw.select('.drawing_path').first();
  current_path.attr({'d' : drawing_path_dpoint});
  drawing_path_dpoint="";
  current_path.removeClass('drawing_path');
  if(current_path.clear().array().settle().length <= 1)  current_path.remove();
  set_closePathNode();
  set_InitLastNode();
  now_drawing_path_ID = "";
}

function set_InitLastNode(){
  draw.select('.init_node , .last_node').each(function(i,children){
    this.remove();
  })
  draw.select('.connected:not(.drawing_path)').each(function(i , children){
    let dpoint = this.clear().array().settle();
    let node_width = RECT_WIDTH/(2.5*draw.zoom()) , node_height = RECT_HEIGHT/(2.5*draw.zoom());
    if(dpoint[dpoint.length-1][0] !== "Z"){
      let ix = dpoint[0][1] , iy = dpoint[0][2];
      let lx = dpoint[dpoint.length-1][1] , ly = dpoint[dpoint.length-1][2];
      let init_node = draw.rect(node_width , node_height).addClass('init_node').front();
      init_node.attr({
        'x' : ix - init_node.width()/2,  'y' : iy - init_node.width()/2,
        'fill': DRAW_NODE_COLOR, 'connectedID' : this.attr('id')
      })
      let last_node = draw.rect(node_width , node_height).addClass('last_node').front();
      last_node.attr({
        'x' : lx - last_node.width()/2, 'y' : ly - last_node.height()/2,
        'fill': DRAW_NODE_COLOR, 'connectedID' : this.attr('id')
      })
      init_node.off('mouseover').mouseover(function(){
        this.attr({ 'fill': DRAW_HOVER_COLOR , 'cursor' : 'pointer' }).addClass('hovering_node');
      }).off('mouseout').mouseout(function(){
        this.attr({ 'fill': DRAW_NODE_COLOR , 'cursor' : 'default'}).removeClass('hovering_node');
      })
      last_node.off('mouseover').mouseover(function(){
        this.attr({ 'fill': DRAW_HOVER_COLOR , 'cursor' : 'pointer'}).addClass('hovering_node');
      }).off('mouseout').mouseout(function(){
        this.attr({ 'fill': DRAW_NODE_COLOR , 'cursor' : 'default'}).removeClass('hovering_node');
      })
    }
  })
}
