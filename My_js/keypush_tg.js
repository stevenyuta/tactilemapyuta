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
          if(current_mode === 'Draw' && draw.select('.drawing_path').first())  draw_end_function();
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
              if(e.keyCode===37)this.dx(-CURSOR_KEY_MOVE);
              if(e.keyCode===38)this.dy(-CURSOR_KEY_MOVE);
              if(e.keyCode===39)this.dx(CURSOR_KEY_MOVE);
              if(e.keyCode===40)this.dy(CURSOR_KEY_MOVE);
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
                let nears = getSimultaneouslyEdit_element(this);
                if(nears.afterPath){
                  let dpoint = nears.afterPath.clear().array().settle(); //pathのdpoint配列を取得
                  nears.afterPath.attr({'d':''}).M({x: cx, y: cy}).L({x: dpoint[1][1], y: dpoint[1][2]});
                }
                if(nears.beforePath){
                  let dpoint = nears.beforePath.clear().array().settle() //pathのdpoint配列を取得
                  nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: cx, y: cy});
                }
              }else{
                let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
                let x1 = 0 , y1 = 0 , x2 = 0 , y2 = 0;
                if(e.keyCode===37) x1 = dpoint[0][1] - CURSOR_KEY_MOVE , y1 = dpoint[0][2] , x2 = dpoint[1][1] - CURSOR_KEY_MOVE , y2 = dpoint[1][2];
                if(e.keyCode===38) x1 = dpoint[0][1] , y1 = dpoint[0][2] - CURSOR_KEY_MOVE , x2 = dpoint[1][1] , y2 = dpoint[1][2] - CURSOR_KEY_MOVE;
                if(e.keyCode===39) x1 = dpoint[0][1] + CURSOR_KEY_MOVE , y1 = dpoint[0][2] , x2 = dpoint[1][1] + CURSOR_KEY_MOVE , y2 = dpoint[1][2];
                if(e.keyCode===40) x1 = dpoint[0][1] , y1 = dpoint[0][2] + CURSOR_KEY_MOVE , x2 = dpoint[1][1] , y2 = dpoint[1][2] + CURSOR_KEY_MOVE;
                this.attr({'d':''}).M({x: x1, y: y1}).L({x: x2, y: y2});
                let nears = getSimultaneouslyEdit_element(this);
                if(nears.beforeRect) nears.beforeRect.attr({'x': x1 - nears.beforeRect.width()/2,'y':y1 - nears.beforeRect.height()/2});
                if(nears.afterRect) nears.afterRect.attr({'x':x2 - nears.afterRect.width()/2,'y':y2 - nears.afterRect.height()/2});
                if(nears.beforePath){
                  let dpoint = nears.beforePath.clear().array().settle(); //pathのdpoint配列を取得
                  nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: x1, y: y1});
                }
                if(nears.afterPath){
                  let dpoint = nears.afterPath.clear().array().settle() //pathのdpoint配列を取得
                  nears.afterPath.attr({'d':''}).M({x: x2, y: y2}).L({x: dpoint[1][1], y: dpoint[1][2]});
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
          if($('#rb_width').is(':focus')) update_resizeBox('width');
          if($('#rb_height').is(':focus')) update_resizeBox('height');
          if($('#textInfo_TextBox').is(':focus')) update_TextInfoBox();
        }
        if($('#StrokeWidth_TextBox').is(':focus')) update_StrokeWidth_TextBox();
        if($('#resizeInk_TextBox').is(':focus')) update_resizeInk_TextBox();
        if($('#resizeBraille_TextBox').is(':focus')) update_resizeBraille_TextBox();
        if($('#ImageOpacity_TextBox').is(':focus')) update_ImageOpacity_TextBox();
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
