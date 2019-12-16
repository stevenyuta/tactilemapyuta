function set_key_down_up(){
  $(document).off('keydown').on('keydown' , function(e){
    //現在のモードを記憶
    let current_mode = $('input[name="tg_mode"]:checked').val();
    //テキストボックスにフォーカスている時はfalse
    let focus_flag = true;
    if($(':focus').length !== 0){
      if($(':focus').first().attr('type') === 'text') focus_flag = false;
    }
    if(focus_flag){
      if(e.ctrlKey){ //ctrlキーを押している場合
        if(!input_key_buffer[17] && current_mode === 'EditPath') editpath_mousemove('90degree', mx, my);
        switch(e.keyCode){
          case 90: //Zキー　：元に戻す
            undo();
            break;
          case 89: //Yキー　：　やり直し
            redo();
            break;
          case 67: //Cキー　：コピー
            copy_select();
            break;
          case 86: //Vキー ：貼り付け
            paste_select();
            break;
          default:
        }
        draw.panZoom({ //zoomの導入
          doPanning: false,
          zoomFactor: 0.03,
          zoomMin: 0.25,
          zoomMax: 5
        })
      }
      switch(e.keyCode){
        case 13: //Enterキー
        case 27: //ESCキー
          if(current_mode === 'Draw' && now_drawing_path_ID !== "")  draw_end_function();
          break;
        case 46: // deleteキー
          if(current_mode === "Edit" || current_mode === "EditImage") delete_select();
          if(current_mode === 'EditPath') delete_editpath();
          break;
        case 37: // ← key
        case 38: // ↑ key
        case 39: // → key
        case 40: // ↓ key
          e.preventDefault();
          if(current_mode === 'Edit' || current_mode === "EditImage"){
            draw.select('.edit_select').each(function(i, children){
              if(this.hasClass('image')){
                let matrix = this.transform('matrix');
                let new_matrix_e = Number(matrix.e) , new_matrix_f = Number(matrix.f);
                if(e.keyCode===37)new_matrix_e = new_matrix_e-CURSOR_KEY_MOVE;
                if(e.keyCode===38)new_matrix_f = new_matrix_f-CURSOR_KEY_MOVE;
                if(e.keyCode===39)new_matrix_e = new_matrix_e+CURSOR_KEY_MOVE;
                if(e.keyCode===40)new_matrix_f = new_matrix_f+CURSOR_KEY_MOVE;
                this.transform({
                  'a': matrix.a,'b': matrix.b,'c': matrix.c,
                  'd': matrix.d,'e': new_matrix_e,'f': new_matrix_f
                })
              }else if(this.hasClass('ink') || this.hasClass('braille')){  //text、image要素の場合
                let px = Number(this.attr('x')),py = Number(this.attr('y')); //テキストの座標位置
                if(e.keyCode===37)this.attr('x',px-CURSOR_KEY_MOVE);
                if(e.keyCode===38)this.attr('y',py-CURSOR_KEY_MOVE);
                if(e.keyCode===39)this.attr('x',px+CURSOR_KEY_MOVE);
                if(e.keyCode===40)this.attr('y',py+CURSOR_KEY_MOVE);
              }else{
                if(e.keyCode===37)this.dx(-CURSOR_KEY_MOVE);
                if(e.keyCode===38)this.dy(-CURSOR_KEY_MOVE);
                if(e.keyCode===39)this.dx(CURSOR_KEY_MOVE);
                if(e.keyCode===40)this.dy(CURSOR_KEY_MOVE);
              }
            })
            SVG.get('handle_group').each(function(i,children){
              if(this.id()==='box_resize'){
                let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
                let d = "";
                for(let j = 0; j < dpoint.length; j++){
                  if(dpoint[j][0]!=="Z"){  //属性がZ以外の場合
                    let d_x = Number(dpoint[j][1]) , d_y = Number(dpoint[j][2]);
                    if(e.keyCode===37) d_x -= CURSOR_KEY_MOVE;
                    if(e.keyCode===38) d_y -= CURSOR_KEY_MOVE;
                    if(e.keyCode===39) d_x += CURSOR_KEY_MOVE;
                    if(e.keyCode===40) d_y += CURSOR_KEY_MOVE;
                    d += dpoint[j][0]+" "+ d_x +" "+ d_y; //新しい座標として格納
                  }else{
                    d += dpoint[j][0];
                  }
                }
                this.attr({'d': d});
              }else{
                if(e.keyCode===37)this.dx(-CURSOR_KEY_MOVE);
                if(e.keyCode===38)this.dy(-CURSOR_KEY_MOVE);
                if(e.keyCode===39)this.dx(CURSOR_KEY_MOVE);
                if(e.keyCode===40)this.dy(CURSOR_KEY_MOVE);
              }
            })
          }else if(current_mode === 'EditPath'){
            draw.select('.editing_target').each(function(i, children){
              if(this.hasClass('edit_rect')){
                let original_cx = this.attr('x') + this.width()/2, original_cy = this.attr('y') + this.height()/2; //クリックを行った点
                let cx = 0 , cy = 0;
                if(e.keyCode===37) cx = original_cx - CURSOR_KEY_MOVE , cy = original_cy;
                if(e.keyCode===38) cx = original_cx, cy = original_cy - CURSOR_KEY_MOVE;
                if(e.keyCode===39) cx = original_cx + CURSOR_KEY_MOVE , cy = original_cy;
                if(e.keyCode===40) cx = original_cx, cy = original_cy + CURSOR_KEY_MOVE;
                this.attr({'x':cx - this.width()/2}) , this.attr({'y':cy - this.height()/2}); //円の位置を格納
                let nears = get_nears(this);
                if(nears.afterSegment){
                  let dpoint = nears.afterSegment.clear().array().settle(); //pathのdpoint配列を取得
                  nears.afterSegment.attr({'d':''}).M({x: cx, y: cy}).L({x: dpoint[1][1], y: dpoint[1][2]});
                }
                if(nears.beforeSegment){
                  let dpoint = nears.beforeSegment.clear().array().settle() //pathのdpoint配列を取得
                  nears.beforeSegment.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: cx, y: cy});
                }
              }else{
                let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
                let x1 = 0 , y1 = 0 , x2 = 0 , y2 = 0;
                if(e.keyCode===37) x1 = dpoint[0][1] - CURSOR_KEY_MOVE , y1 = dpoint[0][2] , x2 = dpoint[1][1] - CURSOR_KEY_MOVE , y2 = dpoint[1][2];
                if(e.keyCode===38) x1 = dpoint[0][1] , y1 = dpoint[0][2] - CURSOR_KEY_MOVE , x2 = dpoint[1][1] , y2 = dpoint[1][2] - CURSOR_KEY_MOVE;
                if(e.keyCode===39) x1 = dpoint[0][1] + CURSOR_KEY_MOVE , y1 = dpoint[0][2] , x2 = dpoint[1][1] + CURSOR_KEY_MOVE , y2 = dpoint[1][2];
                if(e.keyCode===40) x1 = dpoint[0][1] , y1 = dpoint[0][2] + CURSOR_KEY_MOVE , x2 = dpoint[1][1] , y2 = dpoint[1][2] + CURSOR_KEY_MOVE;
                this.attr({'d':''}).M({x: x1, y: y1}).L({x: x2, y: y2});
                let nears = get_nears(this);
                if(nears.beforeNode) nears.beforeNode.attr({'x': x1 - nears.beforeNode.width()/2,'y':y1 - nears.beforeNode.height()/2});
                if(nears.afterNode) nears.afterNode.attr({'x':x2 - nears.afterNode.width()/2,'y':y2 - nears.afterNode.height()/2});
                if(nears.beforeSegment){
                  let dpoint = nears.beforeSegment.clear().array().settle(); //pathのdpoint配列を取得
                  nears.beforeSegment.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: x1, y: y1});
                }
                if(nears.afterSegment){
                  let dpoint = nears.afterSegment.clear().array().settle() //pathのdpoint配列を取得
                  nears.afterSegment.attr({'d':''}).M({x: x2, y: y2}).L({x: dpoint[1][1], y: dpoint[1][2]});
                }
              }
            })
          }
          break;
        default:
      }
    }else{
      if(e.keyCode === 13){
        if(current_mode === 'Edit' || current_mode === 'EditImage'){
          if($('#textbox_selectBox_width').is(':focus')) update_resizeBox('width');
          if($('#textbox_selectBox_height').is(':focus')) update_resizeBox('height');
          if($('#textbox_text_info').is(':focus')) update_TextInfoBox();
        }
        if($('#dottedLine_line').is(':focus') || $('#dottedLine_space').is(':focus')) update_dottedLine();
        if($('#textbox_strokewidth').is(':focus')) update_textbox_strokewidth();
        if($('#textbox_resize_ink').is(':focus')) update_resizeInk_TextBox();
        if($('#textbox_resize_braille').is(':focus')) update_resizeBraille_TextBox();
        if($('#textbox_image_opacity').is(':focus')) update_textbox_image_opacity();
      }
    }
    input_key_buffer[e.keyCode] = true;
  })
  $(document).off('keyup').on('keyup' , function(e){
    if($(':focus').length === 0){
      let current_mode = $('input[name="tg_mode"]:checked').val();
      if(!e.ctrlKey){ //ctrlキー押下時
        draw.panZoom({ //zoomの導入
          doPanning: false,
          zoomFactor: 0.2,
          zoomMin: 0.25,
          zoomMax: 5
        })
        if(current_mode === 'EditPath'){
          editpath_mousemove('connect');
          if(draw.select('.editing_target:not(.edit_circle)').first()) editpath_mousemove('normal');
        }
      }
    }
    input_key_buffer[e.keyCode] = false;
  })
}


function fig_straight(){
  var thre_angle_max = Math.tan( 85 * (Math.PI/180) ); //垂直線だと判定するための閾値
  var thre_angle_min = Math.tan( 5 * (Math.PI/180) ); //平行線だと判定するための閾値
  draw.select('.edit_select.connected , .segmented').each(function(i , children){
    var attr_d = '';
    var dpoint = this.clear().array().settle() //pathのdpoint配列を取得
    for(var j=0; j < dpoint.length - 1; j++){
      if(dpoint[j + 1][0] !== 'Z'){
        var path_x1_base = Number( dpoint[j][1]);
        var path_y1_base = Number( dpoint[j][2]);
        var path_x2_base = Number( dpoint[j + 1][1]);
        var path_y2_base = Number( dpoint[j + 1][2]);
      }else{
        var path_x1_base = Number( dpoint[j][1]);
        var path_y1_base = Number( dpoint[j][2]);
        var path_x2_base = Number( dpoint[0][1]);
        var path_y2_base = Number( dpoint[0][2]);
      }
      var tan = Math.abs(path_y2_base-path_y1_base) / Math.abs(path_x2_base - path_x1_base); //対象の直線の傾きを求める
      if(tan > thre_angle_max || tan < thre_angle_min ){
        if(tan > thre_angle_max) path_x1_base = path_x2_base;
        if(tan < thre_angle_min) path_y1_base = path_y2_base;
      }
      attr_d += dpoint[j][0] + ' ' + path_x1_base + ' ' +  path_y1_base + ' ';
      if(j===dpoint.length - 2){
        if(dpoint[j + 1][0] === 'Z'){
          attr_d += 'Z ';
        }else{
        attr_d += dpoint[j + 1][0] + ' ' + path_x2_base + ' ' +  path_y2_base + ' ';
        }
      }
    }
    this.attr({'d' : attr_d});
    if(this.hasClass('segmented')){ //segmented パスの場合
      let dpoint = this.clear().array().settle();
      let x1 = Number(dpoint[0][1]) , y1 = Number(dpoint[0][2]);
      let x2 = Number(dpoint[1][1]) , y2 = Number(dpoint[1][2]);
      let nears = get_nears(this);
      if(nears.beforeNode) nears.beforeNode.attr({'x':x1 - nears.beforeNode.width()/2,'y':y1 - nears.beforeNode.height()/2});
      if(nears.afterNode) nears.afterNode.attr({'x':x2 - nears.afterNode.width()/2,'y':y2 - nears.afterNode.height()/2});
      if(nears.beforeSegment){
        let dpoint = nears.beforeSegment.clear().array().settle();
        nears.beforeSegment.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: x1, y: y1});
      }
      if(nears.afterSegment){
        let dpoint = nears.afterSegment.clear().array().settle();
        nears.afterSegment.attr({'d':''}).M({x: x2, y: y2}).L({x: dpoint[1][1], y: dpoint[1][2]});
      }
    }
  })
}

function fig_connect(){
  var thre_xy = 5;
  var thre_distance = 5;
  draw.select('.edit_select.connected,.segmented').each(function(i , children){
    var dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
    for(var j=0; j < dpoint.length - 1; j++){
      if(dpoint[j + 1][0] !== 'Z'){
        var path_x1_base = Number( dpoint[j][1]);
        var path_y1_base = Number( dpoint[j][2]);
        var path_x2_base = Number( dpoint[j + 1][1]);
        var path_y2_base = Number( dpoint[j + 1][2]);
      }else{
        var path_x1_base = Number( dpoint[j][1]);
        var path_y1_base = Number( dpoint[j][2]);
        var path_x2_base = Number( dpoint[0][1]);
        var path_y2_base = Number( dpoint[0][2]);
      }

      var relativeXY = get_relativeXY(path_x1_base ,path_y1_base, path_x2_base , path_y2_base , thre_xy); //直線の領域のx,y座標
      var line_param = getLineParam(path_x1_base , path_y1_base , path_x2_base , path_y2_base);

      draw.select('.edit_select.connected,.segmented').each(function(k , children){
        var attr_d = '';
        var dpoint_select = this.clear().array().settle(); //pathのdpoint配列を取得
        for(var l=0; l < dpoint_select.length; l++){
          if(dpoint_select[l][0] !== 'Z'){
            var path_x1 = Number( dpoint_select[l][1] )
            var path_y1 = Number( dpoint_select[l][2] )


            var distance = Math.abs(line_param.a * path_x1 + line_param.b * path_y1 + line_param.c)/Math.sqrt(line_param.a * line_param.a + line_param.b * line_param.b);
            if(distance < thre_distance  && path_x1 > relativeXY.min_x && path_x1 < relativeXY.max_x && path_y1 > relativeXY.min_y && path_y1 < relativeXY.max_y){
              var straight_change_x = (line_param.b * line_param.b * path_x1 - line_param.a * line_param.b * path_y1 - line_param.a * line_param.c)/(line_param.a * line_param.a + line_param.b * line_param.b);
              var straight_change_y =  - (line_param.a * line_param.b * path_x1 - line_param.a * line_param.a * path_y1 + line_param.b * line_param.c)/(line_param.a * line_param.a + line_param.b * line_param.b);
              if(straight_change_x < (relativeXY.min_x + thre_xy) ){
                straight_change_x = relativeXY.min_x + thre_xy;
              }
              if(straight_change_x > (relativeXY.max_x - thre_xy) ){
                straight_change_x = relativeXY.max_x - thre_xy;
              }
              if(straight_change_y < (relativeXY.min_y + thre_xy) ){
                straight_change_y = relativeXY.min_y + thre_xy;
              }
              if(straight_change_y > (relativeXY.max_y - thre_xy) ){
                straight_change_y = relativeXY.max_y - thre_xy;
              }
            }else{
              var straight_change_x = path_x1
              var straight_change_y = path_y1
            }

            attr_d += dpoint_select[l][0] + ' ' + straight_change_x + ' ' + straight_change_y + ' '

          }else{
            attr_d += 'Z '
          }
        }
        this.attr({ 'd' : attr_d });
        if(this.hasClass('segmented')){ //segmented パスの場合
          let dpoint = this.clear().array().settle();
          let x1 = Number(dpoint[0][1]) , y1 = Number(dpoint[0][2]);
          let x2 = Number(dpoint[1][1]) , y2 = Number(dpoint[1][2]);
          let nears = get_nears(this);
          if(nears.beforeNode) nears.beforeNode.attr({'x':x1 - nears.beforeNode.width()/2,'y':y1 - nears.beforeNode.height()/2});
          if(nears.afterNode) nears.afterNode.attr({'x':x2 - nears.afterNode.width()/2,'y':y2 - nears.afterNode.height()/2});
        }
      })
    }
  })
}

function fig_pathUpload(){
  //描画中の線の更新
  if(SVG.get('#' + now_drawing_path_ID)){
    drawing_path = SVG.get('#' + now_drawing_path_ID);
    let dpoint = drawing_path.clear().array().settle();
    current_x = dpoint[dpoint.length-1][1];
    current_y = dpoint[dpoint.length-1][2];
    drawing_path_dpoint="";
    for(let i=0; i < dpoint.length-1; i++){
      drawing_path_dpoint += dpoint[i][0] +" "+ dpoint[i][1] + " " + dpoint[i][2];
    }
    set_closePathNode();
  }
  //線の詳細編集の更新
  draw.select('.Segments_Group').each(function(i,children){
    let Segments_Group_Number = this.attr('Segments_Group_Number');
    let closed;
    this.hasClass('closed_path') ? closed = true : closed = false;
    this.each(function(j,children){
      let assignment_Number = Number(this.attr('assignment_Number'));
      let dpoint = this.clear().array().settle();
      let rect_id = 'node_' + Segments_Group_Number + '_' + assignment_Number;
      let rect = SVG.get(rect_id);
      rect.attr({
        'x' : dpoint[0][1] - rect.width()/2,
        'y' : dpoint[0][2] - rect.height()/2
      })
      if(!closed){ //閉じていないpathの場合
        let rect_id = 'node_' + Segments_Group_Number + '_' + (assignment_Number + 1);
        let rect = SVG.get(rect_id);
        rect.attr({
          'x' : dpoint[1][1] - rect.width()/2,
          'y' : dpoint[1][2] - rect.height()/2
        })
      }
    })
  })
  update_fill_path();
}

//線の補正機能
function straight_connect(){
  fig_connect();
  fig_straight();
  fig_connect();
  fig_pathUpload();
  if(draw.select('.connected').first()) cash_svg();
}
