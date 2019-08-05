/******************************************************
//線描画を行う機能
******************************************************/
function draw_line(){
  let current_x = 0, current_y = 0;
  let drawing_path;
  draw_mousemove();
  draw_mousedown();
  set_InitLastNode();
  if(SVG.get('#'+ now_drawing_path_ID)){ //現在、描いている線がある時
    let d_array = SVG.get('#'+ now_drawing_path_ID).clear().array().settle();
    current_x = d_array[d_array.length-1][1];
    current_y = d_array[d_array.length-1][2];
    drawing_path_dpoint="";
    for(let i=0; i < d_array.length; i++){
      drawing_path_dpoint += d_array[i][0] +" "+ d_array[i][1] + " " + d_array[i][2];
    }
    set_closePathNode();
  }else{
    now_drawing_path_ID = "";
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
      if(SVG.get('#'+ now_drawing_path_ID)) SVG.get('#'+ now_drawing_path_ID).attr({'d' : drawing_path_dpoint + 'L ' + mx +' '+ my});
    })
  }

  /*********************************************
  //マウスクリック時のイベントを設定する関数
  **********************************************/
  function draw_mousedown(){
    draw.off('mousedown').mousedown(function(e){
      if(e.button===0){ //左クリック時
        //textbox_strokewidthの値が何もないまたは0の場合はリセットボタンを発火させる（透明な線を表示させないようにするため）
        if($('#textbox_strokewidth').val()==='') $('#button_reset_strokewidth').click();
        if($('#textbox_strokewidth').val()==='0' && $('input[name="draw_line_fillRadio"]:checked').val()==='none') $('#button_reset_strokewidth').click();

        let position_num = getPathCirclePos();
        if(!SVG.get('#'+ now_drawing_path_ID)){  //書き始めの場合：drawing_pathクラスをもつ要素がない
          if(draw.select('.hovering_node.init_node').first()){ //他のpath（線）の始点ノードをホバーしている時の処理
            let connectedPath = SVG.get(draw.select('.hovering_node.init_node').first().attr('connectedID')); //対象の始点ノードをもつpathをidで入手
            let d_array = connectedPath.clear().array().settle();
            connectedPath.attr({'d' : ''});
            drawing_path_dpoint="";
            for(let j = d_array.length - 1; j >= 0; j--){
              if(j===d_array.length - 1){
                connectedPath.M({x : d_array[j][1] , y : d_array[j][2]});
                drawing_path_dpoint += "M "+ d_array[j][1] + " " + d_array[j][2];
              }else{
                connectedPath.L({x : d_array[j][1] , y : d_array[j][2]});
                drawing_path_dpoint += "L "+ d_array[j][1] + " " + d_array[j][2];
              }
            }
            now_drawing_path_ID = connectedPath.id();
            current_x = d_array[0][1], current_y = d_array[0][2];
            set_closePathNode();
          }else if(draw.select('.hovering_node.last_node').first()){ //他のpathの終点ノードのホバー時
            let connectedPath = SVG.get(draw.select('.hovering_node.last_node').first().attr('connectedID'));
            let d_array = connectedPath.clear().array().settle();
            now_drawing_path_ID = connectedPath.id();
            current_x = d_array[d_array.length-1][1], current_y = d_array[d_array.length-1][2];
            /*現在のdrawing_pathのd属性情報を記憶*/
            drawing_path_dpoint="";
            for(let i=0; i < d_array.length; i++){
              drawing_path_dpoint += d_array[i][0] +" "+ d_array[i][1] + " " + d_array[i][2];
            }
            set_closePathNode();
          }else{ //ノードをホバーしていない場合
            drawing_path = draw.path().M({x: mx, y: my}); //pathの描画
            now_drawing_path_ID = drawing_path.id();
            drawing_path.attr({
              'fill': $('input[name="draw_line_fillRadio"]:checked').val(),
              'stroke': $('#custom_stroke_color').val(),
              'stroke-width': PS_WIDTH*$('#textbox_strokewidth').val(),
              'stroke-linejoin': 'round'
            })
            if($('input[name="draw_line_fillRadio"]:checked').val()==='custom') drawing_path.fill($('#draw_fill_color').val());
            if($('input[name="stroke"]:checked').attr('id')==='radio_dotted_path'){
              drawing_path.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
            }
            drawing_path.addClass('connected').addClass('SVG_Element').addClass('path');
            drawing_path.back();
            for(var i=0; i< position_num; i++) drawing_path.forward();
            current_x = mx, current_y = my;
            drawing_path_dpoint="";
            let dp_dpoint = drawing_path.clear().array().settle();
            for(let i=0; i < dp_dpoint.length; i++){
              drawing_path_dpoint += dp_dpoint[i][0] +" "+ dp_dpoint[i][1] + " " + dp_dpoint[i][2];
            }
          }
        }else{  //書き始めでない場合：drawing_pathクラスをもつ要素がある
          drawing_path = SVG.get('#'+ now_drawing_path_ID);
          drawing_path.attr({'d' : drawing_path_dpoint});
          drawing_path_dpoint="";
          if(draw.select('.hovering_node.init_node').first()){
            let connectedPath = SVG.get(draw.select('.hovering_node.init_node').first().attr('connectedID'));
            connectedPath_dpoint = connectedPath.clear().array().settle();
            for(let i = 0; i < connectedPath_dpoint.length; i++){
              drawing_path.L({x : connectedPath_dpoint[i][1] , y : connectedPath_dpoint[i][2]});
            }
            connectedPath.remove();
            selector_delete('.close_node');
            now_drawing_path_ID = "";
          }else if(draw.select('.hovering_node.last_node').first()){
            let connectedPath = SVG.get('#' + draw.select('.hovering_node.last_node').first().attr('connectedID'));
            connectedPath_dpoint = connectedPath.clear().array().settle();
            for(let i = connectedPath_dpoint.length -1; i >= 0; i--){
              drawing_path.L({x : connectedPath_dpoint[i][1] , y : connectedPath_dpoint[i][2]});
            }
            connectedPath.remove();
            selector_delete('.close_node');
            now_drawing_path_ID = "";
          }else if(draw.select('.hovering_node.close_node').first()){
            drawing_path.Z(); //drawing_pathクラスを排除
            selector_delete('.close_node');
            now_drawing_path_ID = "";
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
  selector_delete('.close_node');
  if(SVG.get('#'+ now_drawing_path_ID)){
    let dpoint = SVG.get('#'+ now_drawing_path_ID).clear().array().settle();
    if(dpoint.length >= 3){
      let ix = dpoint[0][1] , iy = dpoint[0][2];
      let closePath_rect = draw.rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('close_node').front();
      closePath_rect.attr({
        'x' : ix - closePath_rect.width()/2,
        'y' : iy - closePath_rect.width()/2,
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
  let current_path = SVG.get('#'+ now_drawing_path_ID);
  current_path.attr({'d' : drawing_path_dpoint});
  now_drawing_path_ID = "";
  drawing_path_dpoint="";
  if(current_path.clear().array().settle().length <= 1)  current_path.remove();
  set_closePathNode();
  set_InitLastNode();
}

function set_InitLastNode(){
  selector_delete('.init_node , .last_node');
  draw.select('.connected').each(function(i , children){
    if(this.id() !== now_drawing_path_ID){
      let dpoint = this.clear().array().settle();
      let node_width = RECT_WIDTH/(2.5*draw.zoom()) , node_height = RECT_HEIGHT/(2.5*draw.zoom());
      if(dpoint[dpoint.length-1][0] !== "Z"){
        let ix = dpoint[0][1] , iy = dpoint[0][2];
        let lx = dpoint[dpoint.length-1][1] , ly = dpoint[dpoint.length-1][2];
        let init_node = draw.rect(node_width , node_height).addClass('init_node').front();
        init_node.attr({
          'x' : ix - init_node.width()/2,
          'y' : iy - init_node.width()/2,
          'fill': DRAW_NODE_COLOR,
          'connectedID' : this.attr('id')
        })
        let last_node = draw.rect(node_width , node_height).addClass('last_node').front();
        last_node.attr({
          'x' : lx - last_node.width()/2,
          'y' : ly - last_node.height()/2,
          'fill': DRAW_NODE_COLOR,
          'connectedID' : this.attr('id')
        })
        init_node.off('mouseover').mouseover(function(){
          this.attr({ 'fill': DRAW_HOVER_COLOR, 'cursor' : 'pointer' }).addClass('hovering_node');
        }).off('mouseout').mouseout(function(){
          this.attr({ 'fill': DRAW_NODE_COLOR , 'cursor' : 'default'}).removeClass('hovering_node');
        })
        last_node.off('mouseover').mouseover(function(){
          this.attr({ 'fill': DRAW_HOVER_COLOR , 'cursor' : 'pointer'}).addClass('hovering_node');
        }).off('mouseout').mouseout(function(){
          this.attr({ 'fill': DRAW_NODE_COLOR , 'cursor' : 'default'}).removeClass('hovering_node');
        })
      }
    }
  })
}
