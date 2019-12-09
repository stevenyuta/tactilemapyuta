/**************************************************
直線、四角形、円の描画に関係する関数をまとめたファイル
***************************************************/

//1番最初に起動する関数
function draw_path(){
  //描画中のpathの最先端の座標
  let current_x = 0, current_y = 0;
  //描画中のpath要素を格納する変数
  let drawing_path;

  //直線描画専用のマウスムーブ関数（要はマウスを移動したときに起動する）
  draw_mousemove();
  //直線描画専用のマウスクリック関数（要はマウスをクリックしたときに起動する）
  draw_mousedown();
  //線の先端（緑色の四角形）をクリックすれば線を途中から描くことができる。その緑色の四角形をリセットする関数
  set_InitLastNode();

  //現在、進行形で描いている線がある場合の処理（やり直し、元に戻す機能などをしても描画中だったpathを描画し続けられるようにするため）
  if(SVG.get('#'+ now_drawing_path_ID)){
    let d = SVG.get('#'+ now_drawing_path_ID).clear().array().settle();
    current_x = d[d.length-1][1];
    current_y = d[d.length-1][2];
    drawing_path_dpoint="";
    for(let i=0; i < d.length; i++){
      drawing_path_dpoint += d[i][0] +" "+ d[i][1] + " " + d[i][2];
    }
    //描画中にpathの最初にマウスクリックしたところに追加される紫色の四角形をリセットする関数
    set_closePathNode();
  }else{
    now_drawing_path_ID = "";
  }

  /**********************************
  //マウスを動かしたときに起動する関数
  ***********************************/
  function draw_mousemove(){
    draw.off('mousemove').mousemove(function(e){
      //ctrlキーまたはshiftキーを押しているときで取得するマウスの座標が変化する
      if(input_key_buffer[16] || input_key_buffer[17]){
        mx = getmousepoint('15degree',e,current_x,current_y).x , my = getmousepoint('15degree',e,current_x,current_y).y;
      }else{
        mx = getmousepoint('connect',e).x , my = getmousepoint('connect',e).y;
      }
      if(SVG.get('#'+ now_drawing_path_ID)) SVG.get('#'+ now_drawing_path_ID).attr({'d' : drawing_path_dpoint + 'L ' + mx +' '+ my});
    })
  }

  /*********************************************
  //マウスクリック時の処理を設定する関数
  **********************************************/
  function draw_mousedown(){
    //ダブルクリックの判定に使う変数を定義
    let clickCount = 0;
    draw.off('mousedown').mousedown(function(e){
      //左クリック時の判定
      if(e.button===0){
        //線幅変更用のテキストボックス(#textbox_strokewidth)に何も値がない or 0の場合はリセットボタンを発火させる（透明な線にならないようにするため）
        if($('#textbox_strokewidth').val()==='') $('#button_reset_strokewidth').click();
        if($('#textbox_strokewidth').val()==='0' && $('input[name="draw_path_fillRadio"]:checked').val()==='none') $('#button_reset_strokewidth').click();

        //pathのレイヤの順番で、最適な場所を取得。詳しくはgetPathCirclePos関数を参照して
        let position_num = getPathCirclePos();
        //書き始めの場合：now_drawing_path_IDと一致するidをもつpath要素がない
        if(!SVG.get('#'+ now_drawing_path_ID)){
          //他のpathの始点（緑色の四角形）に触れ（ホバー）ている時の処理
          //hovering_nodeクラスとinit_nodeクラスを持つ要素があるということは、その四角形に触れているっていこと
          if(draw.select('.hovering_node.init_node').first()){
            //その始点をもつpath(connectPath)を入手
            let connectPath = SVG.get(draw.select('.hovering_node.init_node').first().attr('connectedID'));
            //connectPathのd属性と現在描いているpathのd属性を結合してconnectPathを描画中のpathに再定義する
            //ちょっと理解が難しいかもしれない
            let d = connectPath.clear().array().settle();
            connectPath.attr({'d' : ''});
            drawing_path_dpoint="";
            for(let j = d.length - 1; j >= 0; j--){
              if(j===d.length - 1){
                connectPath.M({x : d[j][1] , y : d[j][2]});
                drawing_path_dpoint += "M "+ d[j][1] + " " + d[j][2];
              }else{
                connectPath.L({x : d[j][1] , y : d[j][2]});
                drawing_path_dpoint += "L "+ d[j][1] + " " + d[j][2];
              }
            }
            //now_drawing_path_IDを更新
            now_drawing_path_ID = connectPath.id();
            //current_x,current_yの更新もしておく
            current_x = d_array[0][1], current_y = d_array[0][2];
            //close_nodeも更新しておく
            set_closePathNode();

          //他のpathの終点（緑色の四角形）に触れ（ホバー）ている時の処理
          //触れているってことはhovering_nodeクラスとlast_nodeクラスを持つ要素があるということ
          //基本的にはさっき上で説明した始点(init_node)の場合と構想は似たようなもん。
          }else if(draw.select('.hovering_node.last_node').first()){
            let connectPath = SVG.get(draw.select('.hovering_node.last_node').first().attr('connectedID'));
            let d = connectPath.clear().array().settle();
            now_drawing_path_ID = connectPath.id();
            current_x = d[d.length-1][1], current_y = d[d.length-1][2];
            /*現在のdrawing_pathのd属性情報を記憶*/
            drawing_path_dpoint="";
            for(let i=0; i < d.length; i++){
              drawing_path_dpoint += d[i][0] +" "+ d[i][1] + " " + d[i][2];
            }
            set_closePathNode();
          //始点または終点に触れてない場合　⇒　つまり完全に新しく線を描くということ。
          }else{
            drawing_path = draw.path().M({x: mx, y: my});
            now_drawing_path_ID = drawing_path.id();

            //線の属性、クラスの追加、レイヤーの設定など
            drawing_path.attr({
              'fill': $('input[name="draw_path_fillRadio"]:checked').val(),
              'stroke': $('#custom_stroke_color').val(),
              'stroke-width': PS_WIDTH*$('#textbox_strokewidth').val(),
              'stroke-linejoin': 'round'
            })
            if($('input[name="draw_path_fillRadio"]:checked').val()==='custom') drawing_path.fill($('#draw_fill_color').val());
            if($('input[name="stroke"]:checked').attr('id')==='radio_dotted_path'){
              drawing_path.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
            }
            drawing_path.addClass('connected').addClass('path');
            drawing_path.back();
            for(let i=0; i< position_num; i++) drawing_path.forward();


            current_x = mx, current_y = my;
            drawing_path_dpoint="";
            let d = drawing_path.clear().array().settle();
            for(let i=0; i < d.length; i++){
              drawing_path_dpoint += d[i][0] +" "+ d[i][1] + " " + d[i][2];
            }
          }
        //書き始めでない場合：now_drawing_path_idで取得できる要素がある
        }else{
          //シングルクリックかダブルクリックかによって分岐
          if(!clickCount){
            //現在描画中のpathを取得する
            drawing_path = SVG.get('#'+ now_drawing_path_ID);
            drawing_path.attr({'d' : drawing_path_dpoint});
            drawing_path_dpoint="";
            //pathの始点に触れている時の処理。さっきの書き始めの場合の処理で、始点に触れているときなどの話と同じ構想
            if(draw.select('.hovering_node.init_node').first()){
              let connectPath = SVG.get(draw.select('.hovering_node.init_node').first().attr('connectedID'));
              let d = connectPath.clear().array().settle();
              for(let i = 0; i < d.length; i++){
                drawing_path.L({x : d[i][1] , y : d[i][2]});
              }
              connectPath.remove();
              selector_delete('.close_node');
              now_drawing_path_ID = "";
            //pathの終点に触れている時の処理。書き始めの場合で終点に触れているときなどの話と同じ
            }else if(draw.select('.hovering_node.last_node').first()){
              let connectPath = SVG.get('#' + draw.select('.hovering_node.last_node').first().attr('connectedID'));
              let d = connectPath.clear().array().settle();
              for(let i = d.length -1; i >= 0; i--){
                drawing_path.L({x : d[i][1] , y : d[i][2]});
              }
              connectPath.remove();
              selector_delete('.close_node');
              now_drawing_path_ID = "";
            //描画中の線の最後尾の点をクリックした場合（線を閉じる）の処理
            }else if(draw.select('.hovering_node.close_node').first()){
              drawing_path.Z(); //drawing_pathクラスを排除
              selector_delete('.close_node');
              now_drawing_path_ID = "";
            //他のpathの始点、終点または描画中のpathの最後尾の点のいずれかにも触れてない場合の処理
            }else{
              drawing_path.L({x: mx, y: my});
              current_x = mx , current_y = my;
              /*現在のdrawing_pathのd属性情報を記憶*/
              let dp_dpoint = drawing_path.clear().array().settle();
              for(let i=0; i < dp_dpoint.length; i++){
                drawing_path_dpoint += dp_dpoint[i][0] +" "+ dp_dpoint[i][1] + " " + dp_dpoint[i][2];
              }
              set_closePathNode();
            }
            //ダブルクリック判定用。詳しい説明は省くけど簡単に理解できるはず
            ++clickCount;
            setTimeout( function() {
              clickCount = 0;
            }, 200 ) ;
          // ダブルクリックの場合：要は今描いているpathの描画を終了する
          }else{
            let dp_dpoint = drawing_path.clear().array().settle();
            drawing_path_dpoint="";
            for(let i=0; i < dp_dpoint.length-1; i++){
              drawing_path_dpoint += dp_dpoint[i][0] +" "+ dp_dpoint[i][1] + " " + dp_dpoint[i][2];
            }
            draw_end_function();
            clickCount=0;
          }
        }
        set_InitLastNode();
        cash_svg();
      }
    })
  }
}

/**************************************************************************
この関数は今描いているpathを選び出して、そのpathの最後尾（要は描画開始点）
に紫色(#6495ED)の四角形(close_node)を描画する関数
この四角形はマウスで触れているとき(mouseover)はhovering_nodeクラスが付与され、
触れていないときはhovering_nodeクラスが付与されない。
**************************************************************************/
function set_closePathNode(){
  //まず今あるclose_nodeをすべて削除する
  selector_delete('.close_node');
  //今描画中のpathを取得する
  if(SVG.get('#'+ now_drawing_path_ID)){
    //取得したpathの最後尾の位置に四角形を描く
    let dpoint = SVG.get('#'+ now_drawing_path_ID).clear().array().settle();
    if(dpoint.length >= 3){
      let ix = dpoint[0][1] , iy = dpoint[0][2];
      let closePath_rect = draw.rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('close_node').front();
      closePath_rect.attr({
        'x' : ix - closePath_rect.width()/2,
        'y' : iy - closePath_rect.width()/2,
        'fill': '#6495ED'
      })
      //触れたとき、触れるのが離れたとき、それぞれのイベントを描く
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

/*******************************************************
今描いているpathの描画を終了する関数
********************************************************/
function draw_end_function(){
  let current_path = SVG.get('#'+ now_drawing_path_ID);
  current_path.attr({'d' : drawing_path_dpoint});
  now_drawing_path_ID = "";
  drawing_path_dpoint="";
  if(current_path.clear().array().settle().length <= 1)  current_path.remove();
  set_closePathNode();
  set_InitLastNode();
}

/*******************************************************
描画中以外のpathの端点（始点、終点）に四角形を描く。
これによって途中から線を描いたり、線同士を繋げて描いたりできる
********************************************************/
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


/*********************
//四角形を描画する関数
**********************/
function draw_rect(){
  //四角形はマウスを押し込んだ後にドラッグし、離すことで描画される
  //sx,syは初めに押し込んだ座標、lx,lyは離した座標となる
  let sx = 0 , sy = 0;
  let lx = 0 , ly = 0;
  //rectという名の変数が四角形(path)となる
  //svgではrect要素があり、そっちを使えばって思うかもしれないが、編集のしやすさを
  //考慮して、path要素で四角形を描く
  let rect;
  draw.off('mousedown').on('mousedown', function(e){
    if(e.button===0){
      //textbox_strokewidthの値が何もないまたは0の場合はリセットボタンを発火させる
      if($('#textbox_strokewidth').val()==='') $('#button_reset_strokewidth').click();
      if($('#textbox_strokewidth').val()==='0' && $('input[name="draw_path_fillRadio"]:checked').val()==='none') $('#button_reset_strokewidth').click();
      //sx,syを取得
      sx = getmousepoint('normal',e).x , sy = getmousepoint('normal',e).y;
      let back_num = getPathCirclePos();
      //線の色や塗りつぶしなどの属性やクラスを指定
      rect = draw.path().attr({
        'fill': $('input[name="draw_path_fillRadio"]:checked').val(),
        'stroke-width' : PS_WIDTH * $('#textbox_strokewidth').val(),
        'stroke' : $('#custom_stroke_color').val(),
        'stroke-linejoin': 'round'
      })
      if($('input[name="draw_path_fillRadio"]:checked').val()==='custom') rect.fill($('#draw_fill_color').val());
      if($('input[name="stroke"]:checked').attr('id')==='radio_dotted_path'){
        rect.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
      }
      rect.addClass('connected').addClass('path').back();
      for(let i=0; i< back_num; i++) rect.forward();

      //マウスムーブ時の処理を設定する
      draw.off('mousemove').on('mousemove', function(e){
        //lx lyは常に更新される
        lx = getmousepoint('normal',e).x , ly = getmousepoint('normal',e).y //描画領域上でのマウスポイント計算
        //ctrlキー、shiftキーを押しているときは正方形になるようにする
        if(input_key_buffer[16] || input_key_buffer[17]){
          ((lx-sx) * (ly-sy) < 0) ? lx = sx - (ly - sy) : lx = sx + ly - sy;
        }
        rect.attr({'d':''});
        //四角形の辺があまりにも小さい（マウスドラッグしたときの移動量が小さい）場合はd属性には何も書かない
        if(Math.abs(lx - sx) > 3 && Math.abs(ly - sy) > 3) rect.M({x: sx, y: sy}).L({x: lx, y: sy}).L({x: lx, y: ly}).L({x: sx, y: ly}).Z();
      })
      draw.off('mouseup').on('mouseup', function(e){
        if(e.button===0){
          //d属性に何もない　⇒　つまり辺が小さすぎたときなので、その四角形は削除する
          if(rect.attr('d')===""){
            rect.remove();
          }else{
            cash_svg();
            draw.off('mousemove');
          }
        }
      })
    }
  })
}


/***********************************************************
//円を描画する関数
//上記のdraw_rectで説明したのと一致する点が多いので説明は省略することが多いよ
************************************************************/
function draw_circle(){
  //変数の指定　draw_rect()で説明したのと役割は同じ
  let sx = 0 , sy = 0;
  let lx = 0 , ly = 0;
  let circle;
  draw.off('mousedown').on('mousedown', function(e){
    if(e.button===0){
      //textbox_strokewidthの値が何もないまたは0の場合はリセットボタンを発火させる
      if($('#textbox_strokewidth').val()==='') $('#button_reset_strokewidth').click();
      if($('#textbox_strokewidth').val()==='0' && $('input[name="draw_path_fillRadio"]:checked').val()==='none') $('#button_reset_strokewidth').click();
      sx = getmousepoint('normal',e).x , sy = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
      let back_num = getPathCirclePos();
      circle = draw.circle(0).attr({
        'cx' : sx,
        'cy' : sy,
        'fill': $('input[name="draw_path_fillRadio"]:checked').val(),
        'stroke-width' : PS_WIDTH * $('#textbox_strokewidth').val(),
        'stroke' : $('#custom_stroke_color').val()
      })
      if($('input[name="draw_path_fillRadio"]:checked').val()==='custom') circle.fill($('#draw_fill_color').val());
      if($('input[name="stroke"]:checked').attr('id')==='radio_dotted_path'){
        circle.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
      }
      circle.addClass('circle').back();
      for(let i=0; i< back_num; i++) circle.forward();

      draw.off('mousemove').on('mousemove', function(e){
        lx = getmousepoint('normal',e).x , ly = getmousepoint('normal',e).y //描画領域上でのマウスポイント計算
        let radius = Math.sqrt((sx-lx)*(sx-lx) + (sy-ly)*(sy-ly));
        //↓はちょっと理解しにくいかも。
        //やっていることはドラッグして円を描くときに中心に対してどの方向にドラッグしたかによって
        //円の描かれ方が変わるようにしている。
        lx - sx > 0 ? circle.attr({'cx' : sx + radius/4}) : circle.attr({'cx' : sx - radius/4});
        ly - sy > 0 ? circle.attr({'cy' : sy + radius/4}) : circle.attr({'cy' : sy - radius/4});
        circle.attr({'r' : radius/2});
      })

      draw.off('mouseup').on('mouseup', function(e){
        if(e.button===0){
          circle.attr('r') > 0.3 * SVG_RATIO ? cash_svg() : circle.remove()
          draw.off('mousemove');
        }
      })
    }
  })
}
