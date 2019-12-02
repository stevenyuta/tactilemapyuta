/******************************************************
//要素の移動を行う機能
******************************************************/
function edit(){
  let gX , gY , gWidth , gHeight; //選択ボックスの左隅の座標(gX,gY)と幅(gWidth)と高さ（gHeight）
  $('#textbox_selectBox_width').off('focusout').on('focusout' , function(){update_resizeBox('width')});
  $('#textbox_selectBox_height').off('focusout').on('focusout' , function(){update_resizeBox('height')});
  $('#textbox_text_info').off('focusout').on('focusout' , update_TextInfoBox);

  //画像選択モードから選択モードに移動したときに選択状態の画像は選択を解除する
  draw.select('.edit_select').each(function(i,children){
    if(this.hasClass('image')){
      if(nowchecked!=='EditImage') this.removeClass('edit_select');
    }else{
      if(nowchecked!=='Edit') this.removeClass('edit_select');
    }
  })

  edit_mousedown_up();
  edit_hover();
  upload_handle();

  $(document).on('mouseup' , function() {
    if(event.button===0){
      if(movingFlag) cash_svg();
      movingFlag = false;
      $(document).off("mousemove");
      upload_handle();
    }
  })
}

/****************************************
マウスをmousedown_upしたときに起動する関数
mode = off : イベントの全削除
*****************************************/
function edit_mousedown_up(mode){
  draw.off('mousedown').off('mouseup');
  if(mode!=="off"){
    //select_hoverを持つ要素が存在するということは要素に触れているということ。その要素を選択状態にして、この時は範囲選択はしない。
    if(draw.select('.select_hover').first()){
      let target = draw.select('.select_hover').first(); //触れている要素を入手
      target.on('mousedown', function(event){
        if(event.button===0){
          //shiftキーを押していなければ複数選択しないので、一度edit_clearする
          if(!(input_key_buffer[16] || input_key_buffer[17])) edit_clear();
          //edit_selectクラスを追加し、選択状態であることを示す
          this.addClass('edit_select');
          //選択状態の要素のパラメータ更新
          set_SelectElement_Param();
          //選択ハンドルの位置やイベントを再設定
          upload_handle();
          this.off('mousedown');
          this.removeClass('select_hover');
          edit_hover();
          //↓選択と同時に移動できるようにした(先生からの要望)
          let anchorX = getmousepoint('normal',event).x , anchorY = getmousepoint('normal',event).y;
          let click_dTx = 0 , click_dTy = 0;
          $(document).off('mousemove').mousemove(function(event){
            let affin_info = get_affinmat('drag',event,gX,gY,gWidth,gHeight,anchorX,anchorY,click_dTx,click_dTy);
            let affin_mat = affin_info.affine_mat;
            click_dTx = affin_info.dTx;
            click_dTy = affin_info.dTy;
            update_editgroup(affin_mat , "drag");
          });
        }
      });
    }else if(draw.select('.edit_select').first()===undefined){ //要素に触れてなく、選択状態の要素が何もない場合
      let select_rect = draw.rect().addClass('select_rect');
      select_rect.attr({  //範囲指定用四角形
        'fill' : 'none',
        'stroke': SELECT_RECT_COLOR,
        'stroke-width': SELECT_RECT_STROKEWIDTH,
        'stroke-dasharray': SELECT_RECT_STROKEDOTT //点線に
      })
      //mousedown時はマウスを押し込んだ時の処理。範囲選択の四角形の始点を指定する。
      draw.on('mousedown', function(event){
        if(event.button===0){
          //始点の指定。詳しくはsvg.jsの公式を探してくれ
          select_rect.draw(event);
          //ホバーしたときの処理は全てoffにしておく
          edit_hover("off");
        }
      });
      draw.on('mouseup', function(event){  //mouseup時：終点指定
        if(event.button===0){
          //終点の指定
          select_rect.draw(event);
          //描画した四角形（範囲選択を示す）の各頂点座標を表現する４つのパラメータを指定する
          let sr_min_x =  Number(select_rect.attr('x')) , sr_min_y =  Number(select_rect.attr('y'));
          let sr_max_x =  sr_min_x + Number(select_rect.attr('width')) , sr_max_y =  sr_min_y + Number(select_rect.attr('height'));
          //選択モード時は対象はSVG_element。画像選択モード時は画像が選択の対象になる
          let selector = ( $('input[name="tg_mode"]:checked').val() == "Edit" ) ? '.SVG_Element' : '.image';
          //四角形の範囲に含まれる要素を範囲する
          //もし範囲に含まれていればedit_selectクラスを付与して選択状態にする
          draw.select(selector).each(function(i, children) {
            //要素が非表示だった場合は判定外にする
            if(this.visible()){
              let InArea = true;  //範囲内に入っているかの判定：trueは範囲内、flaseは範囲外
              let bbox = get_bbox(this);
              let pmin_x = bbox.min_x , pmax_x = bbox.max_x;
              let pmin_y = bbox.min_y , pmax_y = bbox.max_y;

              if(pmin_x < sr_min_x || pmin_x > sr_max_x) InArea = false;
              if(pmin_y < sr_min_y || pmin_y > sr_max_y) InArea = false;
              if(pmax_x < sr_min_x || pmax_x > sr_max_x) InArea = false;
              if(pmax_y < sr_min_y || pmax_y > sr_max_y) InArea = false;
              if(InArea) this.addClass('edit_select');
            }
          })
          set_SelectElement_Param();
          edit_hover();
          edit_mousedown_up();
          select_rect.remove();
        }
      });
    }else{ //選択状態の要素が１つ以上ある場合
      draw.on('mousedown', function(event){
        if(event.button===0){
          edit_clear();
          edit_hover();
          edit_mousedown_up();
        }
      })
    }
  }
}

/***************************************
//hoverイベントを設定または再設定する関数
***************************************/
function edit_hover(mode){
  //選択モードまたは画像選択モードに関係する要素のhoverイベントをすべてoffにしておく
  let selector = (nowchecked === "Edit" ) ? '.SVG_Element' : '.image';
  draw.select(selector).off('mouseover').off('mouseout');
  SVG.get('handle_group').off('mouseover').off('mouseout');
  if(mode!=="off"){
    //現在、選択状態になっていない要素に関するマウスオーバー（マウスで上を乗せたとき）イベント
    draw.select(selector + ':not(.edit_select)').mouseover(function(){
      this.addClass('select_hover');
      this.attr({'cursor':'pointer'});
      edit_mousedown_up();
    })
    draw.select(selector + ':not(.edit_select)').mouseout(function(){
      this.removeClass('select_hover');
      edit_mousedown_up();
    })
    SVG.get('handle_group').mouseover(function() {
      edit_mousedown_up("off");
    })
    SVG.get('handle_group').mouseout(function() {
      edit_mousedown_up();
    })
  }
}

/******************************************************
//選択状態を全解除する関数
******************************************************/
function edit_clear(){
  SVG.get('handle_group').hide();
  if($('#textbox_selectBox_width').is(':focus')) update_resizeBox('width');
  if($('#textbox_selectBox_height').is(':focus')) update_resizeBox('height');
  if($('#textbox_text_info').is(':focus')) update_TextInfoBox();
  draw.select('.edit_select').each(function(i, children) {
    if(this.hasClass('connected') && nowchecked === 'EditPath'){
      toSegment(this);
      this.remove();
    }else{
      this.removeClass('edit_select');
    }
  })
  upload_handle();
}

function upload_handle(){
  //移動、サイズ変更、回転用のハンドルを非表示
  SVG.get('handle_group').hide();　
  $('.gadget_resizeInk , .gadget_resize_braille').hide();
  $('.gadget_textInfo').hide();
  $('.stroke_option , .dotted_option').hide();
  $('.gadget_imageOpacity').hide();
  $('#table_layer , #table_select_fill').hide();
  $('.resizeBox_textbox').hide();
  $('#straight_connect_button').hide();
  if(draw.select('.edit_select').first()!==undefined){ //選択状態の要素がない場合
    if(draw.select('.edit_select.ink').first()!==undefined) $('.gadget_resizeInk').show();
    if(draw.select('.edit_select.braille').first()!==undefined) $('.gadget_resize_braille').show();
    if(draw.select('.edit_select.path , .edit_select.circle').first()!==undefined){
      $('.stroke_option').show();
      if($('input[name="stroke"]:checked').attr('id')==='radio_dotted_path') $('.dotted_option').show();
    }
    if(draw.select('.edit_select.path , .edit_select.circle').first()!==undefined) $('#straight_connect_button').show();
    if(draw.select('.edit_select.image').first()!==undefined) $('.gadget_imageOpacity').show();
    if(draw.select('.edit_select.connected , .edit_select.circle').first()!==undefined) $('#table_select_fill').show();
    /***************************************************************
      文字（墨字or点字）が選択状態の場合は編集用のテキストボックスを表示
      そうでない場合は非表示
    ****************************************************************/
    if(draw.select('.edit_select.ink,.edit_select.braille').members.length===1){　
      let text = draw.select('.edit_select.ink,.edit_select.braille').first();
      text.hasClass('ink') ? $('#textbox_text_info').val(text.text()) : $('#textbox_text_info').val(text.attr('brailleorigintext'));
      $('.gadget_textInfo').show();
    }
    SVG.get('handle_group').show().front();　//移動、サイズ変更、回転用のハンドルを表示して最前へ
    $('#table_layer').show();
    $('.resizeBox_textbox').show();

    let gmin_x = 1000000 ,  gmin_y = 1000000;
    let gmax_x = -1000000 , gmax_y = -1000000;
    draw.select('.edit_select').each(function(i , children){
      let bbox = get_bbox(this);
      //ハンドル位置の4隅の座標を更新する
      if(gmin_x > bbox.min_x) gmin_x = bbox.min_x;
      if(gmin_y > bbox.min_y) gmin_y = bbox.min_y;
      if(gmax_x < bbox.max_x) gmax_x = bbox.max_x;
      if(gmax_y < bbox.max_y) gmax_y = bbox.max_y;
    })

    //各ハンドルとなる要素を取得
    // box: 移動 , t : 上部 , l:左部 , b:下部 , r:右部
    // lt : 上左部 , rt:上右部 , lb:下左部 , rb:下右部  , rot:回転
    let box_resize = SVG.get('box_resize').show();
    let t_resize = SVG.get('t_resize').show(); //t:
    let l_resize = SVG.get('l_resize').show();
    let b_resize = SVG.get('b_resize').show();
    let r_resize = SVG.get('r_resize').show();
    let lt_resize = SVG.get('lt_resize').show();
    let rt_resize = SVG.get('rt_resize').show();
    let lb_resize = SVG.get('lb_resize').show();
    let rb_resize = SVG.get('rb_resize').show();
    let rot_resize = SVG.get('rot_resize').show();

    //ハンドル位置の4隅の座標を決定
    gX = gmin_x　, gY = gmin_y;
    gWidth = gmax_x-gmin_x , gHeight = gmax_y-gmin_y;
    if(gWidth < 0.001 || gHeight < 0.001){ //極めて選択した要素が小さい場合には角４隅のハンドルは非表示にする
      lt_resize.hide();
      rt_resize.hide();
      lb_resize.hide();
      rb_resize.hide();
    }
    if(gWidth<0.001){
      gX = gX -2.5;
      gWidth = 5;
    }
    if(gHeight<0.001){
      gY = gY -2.5;
      gHeight = 5;
    }

    let anchorX = 0 , anchorY = 0;
    let dTx = 0 , dTy = 0;
    let cx = 0 , cy = 0 , rad = 0;

    //ハンドル位置の更新
    draw.select('.handle').attr({'transform' : ''});

    box_resize.attr({'d' : ''});
    box_resize.M({x : gX , y : gY}).L({x : gX + gWidth, y : gY}).L({x : gX + gWidth , y : gY + gHeight}).L({x : gX, y : gY + gHeight}).Z();

    t_resize.attr({
      'cx' : gX+gWidth/2,
      'cy' : gY,
      'r' : SELECT_HANDLE_RADIUS/(2*draw.viewbox().zoom)
    });
    l_resize.attr({
      'cx':gX,
      'cy':gY + gHeight/2,
      'r' : SELECT_HANDLE_RADIUS/(2*draw.viewbox().zoom)
    })
    b_resize.attr({
      'cx':gX + gWidth/2,
      'cy':gY + gHeight,
      'r' : SELECT_HANDLE_RADIUS/(2*draw.viewbox().zoom)
    })
    r_resize.attr({
      'cx':gX + gWidth,
      'cy':gY + gHeight/2,
      'r' : SELECT_HANDLE_RADIUS/(2*draw.viewbox().zoom)
    })
    lt_resize.attr({
      'cx':gX,
      'cy':gY,
      'r' : SELECT_HANDLE_RADIUS/(2*draw.viewbox().zoom)
    })
    rt_resize.attr({
      'cx' : gX + gWidth,
      'cy' : gY,
      'r' : SELECT_HANDLE_RADIUS/(2*draw.viewbox().zoom)
    })
    lb_resize.attr({
      'cx' : gX,
      'cy' : gY + gHeight,
      'r' : SELECT_HANDLE_RADIUS/(2*draw.viewbox().zoom)
    })
    rb_resize.attr({
      'cx' : gX + gWidth,
      'cy' : gY + gHeight,
      'r' : SELECT_HANDLE_RADIUS/(2*draw.viewbox().zoom)
    })
    rot_resize.attr({
      'cx' : gX + gWidth/2,
      'cy' : gY - 15/draw.viewbox().zoom,
      'r' : SELECT_HANDLE_RADIUS/(2*draw.viewbox().zoom)
    })


    //幅、高さのテキストボックスに[mm]に換算した値を入力
    $('#textbox_selectBox_width').val(Math.round( gWidth/SVG_RATIO * Math.pow( 10 , 2 ) ) / (Math.pow( 10 , 2 ) ) );
    $('#textbox_selectBox_height').val(Math.round( gHeight/SVG_RATIO * Math.pow( 10 , 2 ) ) / (Math.pow( 10 , 2 ) ) );

    //box_resizeのマウスドラッグでの平行移動
    box_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        anchorX = getmousepoint('normal',e).x , anchorY = getmousepoint('normal',e).y;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('drag',e,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy);
          let affin_mat = affin_info.affine_mat;
          dTx = affin_info.dTx;
          dTy = affin_info.dTy;
          update_editgroup(affin_mat , "drag");
        });
      }
    });

    //top handle
    t_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        anchorX = getmousepoint('normal',e).x , anchorY = getmousepoint('normal',e).y;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('top',e,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy);
          let affin_mat = affin_info.affine_mat;
          dTx = affin_info.dTx;
          dTy = affin_info.dTy;
          update_editgroup(affin_mat　,　'top');
        });
      }
    });

    //left handle
    l_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        anchorX = getmousepoint('normal',e).x , anchorY = getmousepoint('normal',e).y;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('left',e,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy);
          let affin_mat = affin_info.affine_mat;
          dTx = affin_info.dTx;
          dTy = affin_info.dTy;
          update_editgroup(affin_mat , 'left');
        });
      }
    });

    //bottom handle
    b_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        anchorX = getmousepoint('normal',e).x , anchorY = getmousepoint('normal',e).y;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('bottom',e,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy);
          let affin_mat = affin_info.affine_mat;
          dTx = affin_info.dTx;
          dTy = affin_info.dTy;
          update_editgroup(affin_mat , 'bottom');
        });
      }
    });

    //right handle
    r_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        anchorX = getmousepoint('normal',e).x , anchorY = getmousepoint('normal',e).y;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('right',e,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy);
          let affin_mat = affin_info.affine_mat;
          dTx = affin_info.dTx;
          dTy = affin_info.dTy;
          update_editgroup(affin_mat , 'right');
        });
      }
    });

    //left-top handle
    lt_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        anchorX = getmousepoint('normal',e).x , anchorY = getmousepoint('normal',e).y;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('left_top',e,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy);
          let affin_mat = affin_info.affine_mat;
          dTx = affin_info.dTx;
          dTy = affin_info.dTy;
          update_editgroup(affin_mat , 'left_top');
        });
      }
    });

    //right-top handle
    rt_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        anchorX = getmousepoint('normal',e).x , anchorY = getmousepoint('normal',e).y;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('right_top',e,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy);
          let affin_mat = affin_info.affine_mat;
          dTx = affin_info.dTx;
          dTy = affin_info.dTy;
          update_editgroup(affin_mat , 'right_top');
        });
      }
    });

    //left-bottom handle
    lb_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        anchorX = getmousepoint('normal',e).x , anchorY = getmousepoint('normal',e).y;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('left_bottom',e,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy);
          let affin_mat = affin_info.affine_mat;
          dTx = affin_info.dTx;
          dTy = affin_info.dTy;
          update_editgroup(affin_mat , 'left_bottom');
        });
      }
    });

    //right-bottom handle
    rb_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        anchorX = getmousepoint('normal',e).x , anchorY = getmousepoint('normal',e).y;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('right_bottom',e,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy);
          let affin_mat = affin_info.affine_mat;
          dTx = affin_info.dTx;
          dTy = affin_info.dTy;
          update_editgroup(affin_mat , 'right_bottom');
        });
      }
    });

    //rot handle
    rot_resize.off('mousedown').mousedown(function(e){
      if(e.button===0){
        cx = gX + gWidth/2;
        cy = gY + gHeight/2;
        $(document).off('mousemove').mousemove(function(e){
          let affin_info = get_affinmat('rot',e,gX,gY,gWidth,gHeight,cx,cy,rad);
          let affin_mat = affin_info.affine_mat;
          rad = affin_info.rad;
          update_editgroup(affin_mat , 'rot');
        });
      }
    });
  }
}

function get_affinmat(type,event,gX,gY,gWidth,gHeight,anchorX,anchorY,dTx,dTy){
  movingFlag = true;
  let obj = new Object();
  let point1 = new Array() , point2 = new Array(); //affin変換行列作成に使う行列
  for(let i=0;i<3;i++){
    point1[i] = new Array();
    point2[i] = new Array();
  }

  if(type==='rot'){
    let cx = anchorX , cy = anchorY;
    let rad = dTx;
    let px1 = (gX - cx)*Math.cos(rad) - (gY - cy)*Math.sin(rad) + cx;
    let py1 = (gX - cx)*Math.sin(rad) + (gY - cy)*Math.cos(rad) + cy;
    let px2 = (gX + gWidth - cx)*Math.cos(rad) - (gY - cy)*Math.sin(rad) + cx;
    let py2 = (gX + gWidth - cx)*Math.sin(rad) + (gY - cy)*Math.cos(rad) + cy;
    let px3 = (gX - cx)*Math.cos(rad) - (gY + gHeight- cy)*Math.sin(rad) + cx;
    let py3 = (gX - cx)*Math.sin(rad) + (gY + gHeight - cy)*Math.cos(rad) + cy;
    //変換前の3座標の入力
    point1[0]=[px1,px2,px3];
    point1[1]=[py1,py2,py3];
    point1[2]=[1,1,1];

    mx = getmousepoint('normal',event).x; //描画領域上でのマウスポイント計算
    my = getmousepoint('normal',event).y;
    rad = Math.atan(( my-cy )/( mx - cx));
    if(mx - cx < 0) rad = Math.PI + rad;
    if(input_key_buffer[16] || input_key_buffer[17]){
      rad = Math.PI/2+Math.round(rad / (Math.PI/6)) * Math.PI/6
    }else{
      rad = Math.PI/2+Math.round(rad / (Math.PI/90)) * Math.PI/90
    }

    px1 = (gX - cx)*Math.cos(rad) - (gY - cy)*Math.sin(rad) + cx;
    py1 = (gX - cx)*Math.sin(rad) + (gY - cy)*Math.cos(rad) + cy;
    px2 = (gX + gWidth - cx)*Math.cos(rad) - (gY - cy)*Math.sin(rad) + cx;
    py2 = (gX + gWidth - cx)*Math.sin(rad) + (gY - cy)*Math.cos(rad) + cy;
    px3 = (gX - cx)*Math.cos(rad) - (gY + gHeight- cy)*Math.sin(rad) + cx;
    py3 = (gX - cx)*Math.sin(rad) + (gY + gHeight - cy)*Math.cos(rad) + cy;

    //変換後の3座標の入力
    point2[0]=[px1,px2,px3];
    point2[1]=[py1,py2,py3];
    point2[2]=[1,1,1];
    obj.affine_mat = math.multiply(point2 , math.inv(point1));
    obj.rad = rad;
    return obj
  }else{
    if(type==='drag'){
      //変換前の3座標の入力
      point1[0]=[gX + dTx , gX + gWidth + dTx , gX + dTx];
      point1[1]=[gY + dTy, gY + dTy , gY + gHeight + dTy];
      point1[2]=[1,1,1];

      dTx = getmousepoint('normal',event).x - anchorX;
      dTy = getmousepoint('normal',event).y - anchorY;
      //変換後の3座標の入力
      point2[0]=[gX + dTx , gX + gWidth + dTx , gX + dTx];
      point2[1]=[gY + dTy, gY +dTy , gY + gHeight + dTy];
      point2[2]=[1,1,1];
    }else if(type==='top'){
      //変換前の3座標の入力
      point1[0]=[gX , gX + gWidth, gX];
      point1[1]=[gY + dTy, gY + dTy , gY + gHeight];
      point1[2]=[1,1,1];

      dTy = getmousepoint('normal',event).y - anchorY;
      if(gHeight <= dTy) dTy = gHeight - 10; //10という数字に大きな意味はなし

      point2[0]=[gX , gX + gWidth, gX];
      point2[1]=[gY + dTy, gY + dTy , gY + gHeight];
      point2[2]=[1,1,1];
    }else if(type==='left'){
      point1[0]=[gX + dTx , gX + gWidth, gX + dTx];
      point1[1]=[gY, gY , gY + gHeight];
      point1[2]=[1,1,1];

      dTx = getmousepoint('normal',event).x - anchorX;
      if(gWidth <= dTx) dTx = gWidth - 10; //10という数字に大きな意味はなし

      //変換後の3座標の入力
      point2[0]=[gX + dTx , gX + gWidth, gX + dTx];
      point2[1]=[gY, gY , gY + gHeight];
      point2[2]=[1,1,1];
    }else if(type==='bottom'){
      point1[0]=[gX , gX + gWidth, gX];
      point1[1]=[gY, gY , gY + gHeight + dTy];
      point1[2]=[1,1,1];

      dTy = getmousepoint('normal',event).y - anchorY;
      if(gHeight + dTy <=  0 ) dTy = -gHeight + 10; //10という数字に大きな意味はなし

      //変換後の3座標の入力
      point2[0]=[gX , gX + gWidth, gX];
      point2[1]=[gY, gY , gY + gHeight + dTy];
      point2[2]=[1,1,1];
    }else if(type==='right'){
      point1[0]=[gX , gX + gWidth + dTx, gX];
      point1[1]=[gY, gY , gY + gHeight];
      point1[2]=[1,1,1];

      dTx = getmousepoint('normal',event).x - anchorX;
      if(gWidth + dTx <= 0) dTx = -gWidth + 10; //10という数字に大きな意味はなし

      //変換後の3座標の入力
      point2[0]=[gX , gX + gWidth + dTx, gX];
      point2[1]=[gY, gY , gY + gHeight];
      point2[2]=[1,1,1];
    }else if(type==='left_top'){
      point1[0]=[gX + dTx , gX + gWidth, gX + dTx];
      point1[1]=[gY + dTy , gY + dTy, gY + gHeight];
      point1[2]=[1,1,1];

      dTx = getmousepoint('normal',event).x - anchorX; //描画領域上でのマウスポイント計算
      dTy = getmousepoint('normal',event).y - anchorY;

      if(gWidth <= dTx) dTx = gWidth - 10; //10という数字に大きな意味はなし
      if(gHeight <= dTy) dTy = gHeight - 10; //10という数字に大きな意味はなし

      Math.abs(dTx) > Math.abs(dTy) ? dTx = dTy*gWidth/gHeight :  dTy = dTx*gHeight/gWidth;

      //変換後の3座標の入力
      point2[0]=[gX + dTx , gX + gWidth, gX + dTx];
      point2[1]=[gY + dTy , gY + dTy, gY + gHeight];
      point2[2]=[1,1,1];

    }else if(type==='right_top'){
      point1[0]=[gX , gX + gWidth + dTx, gX];
      point1[1]=[gY + dTy , gY + dTy, gY + gHeight];
      point1[2]=[1,1,1];

      dTx = getmousepoint('normal',event).x - anchorX; //描画領域上でのマウスポイント計算
      dTy = getmousepoint('normal',event).y - anchorY;

      if(gWidth + dTx <= 0) dTx = -gWidth + 10; //10という数字に大きな意味はなし
      if(gHeight <= dTy) dTy = gHeight - 10; //10という数字に大きな意味はなし

      Math.abs(dTx) > Math.abs(dTy) ? dTx = -dTy*gWidth/gHeight : dTy = -dTx*gHeight/gWidth;
      //変換後の3座標の入力
      point2[0]=[gX , gX + gWidth + dTx, gX];
      point2[1]=[gY + dTy , gY + dTy, gY + gHeight];
      point2[2]=[1,1,1];
    }else if(type==='left_bottom'){
      point1[0]=[gX + dTx , gX + gWidth, gX + dTx];
      point1[1]=[gY , gY, gY + gHeight + dTy];
      point1[2]=[1,1,1];

      dTx = getmousepoint('normal',event).x - anchorX; //描画領域上でのマウスポイント計算
      dTy = getmousepoint('normal',event).y - anchorY;

      if(gWidth <= dTx) dTx = gWidth - 10; //10という数字に大きな意味はなし
      if(gHeight + dTy <= 0) dTy = -gHeight + 10; //10という数字に大きな意味はなし

      Math.abs(dTx) > Math.abs(dTy) ? dTx = -dTy*gWidth/gHeight : dTy = -dTx*gHeight/gWidth;
      //変換後の3座標の入力
      point2[0]=[gX + dTx , gX + gWidth, gX + dTx];
      point2[1]=[gY , gY, gY + gHeight + dTy];
      point2[2]=[1,1,1];
    }else if(type==='right_bottom'){
      point1[0]=[gX , gX + gWidth + dTx , gX];
      point1[1]=[gY , gY, gY + gHeight + dTy];
      point1[2]=[1,1,1];

      dTx = getmousepoint('normal',event).x - anchorX; //描画領域上でのマウスポイント計算
      dTy = getmousepoint('normal',event).y - anchorY;

      if(gWidth + dTx <= 0) dTx = -gWidth + 10; //10という数字に大きな意味はなし
      if(gHeight + dTy <= 0) dTy = -gHeight + 10; //10という数字に大きな意味はなし

      Math.abs(dTx) > Math.abs(dTy) ? dTx = dTy*gWidth/gHeight : dTy = dTx*gHeight/gWidth

      //変換後の3座標の入力
      point2[0]=[gX , gX + gWidth + dTx , gX];
      point2[1]=[gY , gY, gY + gHeight + dTy];
      point2[2]=[1,1,1];
    }
    obj.affine_mat = math.multiply(point2 , math.inv(point1));
    obj.dTx = dTx;
    obj.dTy = dTy;
    return obj
  }
}

//アフィン変換によるtarget_group内の要素の座標変換
function update_editgroup(affin_mat,scale){
  draw.select('.edit_select').each(function(i,children){
    let matrix = this.transform('matrix');
    let trans_matrix = [[matrix.a, matrix.c, matrix.e]
                      ,[matrix.b, matrix.d, matrix.f]
                      ,[0, 0, 1]]
    trans_matrix = math.multiply(affin_mat , trans_matrix) //座標変換行列をAffin変換
    if(this.hasClass('ink') || this.hasClass('braille')){  //文字要素の場合
      if(scale==="drag" || scale==="rot"){
        this.transform({
          'a': trans_matrix[0][0],'c': trans_matrix[0][1],'b': trans_matrix[1][0],
          'd': trans_matrix[1][1],'e': trans_matrix[0][2],'f': trans_matrix[1][2]
        })
      }else{
        this.transform({
          'a': matrix.a , 'c': matrix.c , 'b': matrix.b,
          'd': matrix.d , 'e': trans_matrix[0][2] , 'f': trans_matrix[1][2]
        })
      }
    }else if(this.hasClass('circle')){ //円要素の場合
      let cx = Number( this.attr('cx') ) , cy = Number( this.attr('cy') );
      let cr = Number( this.attr('r') );
      let pos1 = [ [ cx ],[ cy ],[1]] , pos2;
      switch(scale){
        case 'top':
          pos2 = [ [ cx  ],[ cy - cr ],[1]];
          break;
        case 'left':
          pos2 = [ [ cx - cr ],[ cy ],[1]];
          break;
        case 'bottom':
          pos2 = [ [ cx  ],[ cy + cr ],[1]];
          break;
        case 'right':
          pos2 = [ [ cx + cr],[ cy ],[1]];
          break;
        default:
          pos2 = [ [ cx + cr * Math.sin(Math.PI/4) ],[ cy + cr * Math.cos(Math.PI/4) ],[1]]; //pathの座標を格納
          break;
      }
      pos1 = math.multiply(affin_mat,pos1) , pos2 = math.multiply(affin_mat,pos2); //pathの座標をAffin変
      let new_cr = Math.sqrt( (Number(pos2[0][0])-Number(pos1[0][0])) * (Number(pos2[0][0])-Number(pos1[0][0]))
                              + (Number(pos2[1][0])-Number(pos1[1][0])) * (Number(pos2[1][0])-Number(pos1[1][0])));

      this.attr({
        'cx' : Number(pos1[0][0]),
        'cy' : Number(pos1[1][0]),
        'r' : new_cr
      });
    }else if(this.hasClass('image')){//画像要素の場合
      this.transform({
        'a': trans_matrix[0][0],'c': trans_matrix[0][1],'b': trans_matrix[1][0],
        'd': trans_matrix[1][1],'e': trans_matrix[0][2],'f': trans_matrix[1][2]
      })
    }else{//path要素の場合
      let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
      let d = "";
      for(let j = 0; j < dpoint.length; j++){
        if(dpoint[j][0]!=="Z"){  //属性がZ以外の場合
          let pos1 = [ [ dpoint[j][1] ],[ dpoint[j][2] ],[1]]; //pathの座標を格納
          let trans_matrix = math.multiply(affin_mat,pos1) //pathの座標をAffin変換
          d += dpoint[j][0]+" "+trans_matrix[0][0]+" "+trans_matrix[1][0]; //新しい座標として格納
        }else{
          d += dpoint[j][0];
        }
      }
      this.attr({'d': d});
    }
  })
  SVG.get('handle_group').each(function(i,children){
    if(this.id()=== 'box_resize'){
      let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
      let d = "";
      for(let j = 0; j < dpoint.length; j++){
        if(dpoint[j][0]!=="Z"){  //属性がZ以外の場合
          let pos1 = [ [ dpoint[j][1] ],[ dpoint[j][2] ],[1]]; //pathの座標を格納
          let trans_matrix = math.multiply(affin_mat,pos1) //pathの座標をAffin変換
          d += dpoint[j][0]+" "+trans_matrix[0][0]+" "+trans_matrix[1][0]; //新しい座標として格納
        }else{
          d += dpoint[j][0];
        }
      }
      this.attr({'d': d});
    }else{
      let pos1 = [ [ this.attr('cx') ],[ this.attr('cy') ],[1]]; //pathの座標を格納
      let trans_matrix = math.multiply(affin_mat,pos1) //pathの座標をAffin変換
      this.attr({
        'cx': trans_matrix[0][0],
        'cy': trans_matrix[1][0]
      });
    }
  })
}

/***************************************************************
//テキストボックスの値を変更して、選択した要素のサイズを変更する関数
***************************************************************/
function update_resizeBox(mode){
  //modeがwidthの場合は幅のテキストボックスの値を変更した場合、heightの場合は高さのテキストボックスの値を変更した場合で分ける
  let val = (mode === 'width') ? $('#textbox_selectBox_width').val() : $('#textbox_selectBox_height').val();
  //全角文字で入力した場合のために文字列を変換する
  val = leaveOnlyNumber(val);
  if(!val.match(/[^0-9\.]/) && val!==0 && String(val)!=="\." && String(val)!==""){
    //座標変換用の配列を２つ（変換前、変換後の座標）を作成する
    let point1 = new Array() , point2 = new Array();
    for(let i=0;i<3;i++){
      point1[i] = new Array();
      point2[i] = new Array();
    }
    //選択ボックスを取得し、左上隅の座標とボックスの幅と高さの値を取得する
    let box = SVG.get('box_resize');
    let bx = Number(box.x()) , by = Number(box.y());
    let bwidth = Number(box.width()) , bheight = Number(box.height());
    let new_bwidth ,  new_bheight;
    //幅と高さのテキストボックスのどちらかによって、計算が分岐する。幅を変化させ、高さを縦横比が一致するように変更するか？またはその逆か？
    if(mode==='width'){
      new_bwidth = Number(val) * SVG_RATIO;
      $('#check_aspect').prop('checked') ? new_bheight = new_bwidth * bheight/bwidth : new_bheight = bheight;
    }else{
      new_bheight = Number(val) * SVG_RATIO;
      $('#check_aspect').prop('checked') ? new_bwidth = new_bheight * bwidth/bheight : new_bwidth = bwidth;
    }
    //座標変換用の配列に値を格納
    point1[0]=[bx + bwidth, bx , bx + bwidth];
    point1[1]=[by,by + bheight,  by + bheight];
    point1[2]=[1,1,1];

    point2[0]=[bx + new_bwidth , bx ,bx + new_bwidth];
    point2[1]=[by , by + new_bheight , by + new_bheight];
    point2[2]=[1,1,1];
    //アフィン変換行列を入手。詳しいことはアフィン変換の計算の仕組みをググろう！
    //要は変換前と変換後の3座標を指定することでアフィン変換行列は入手されるんだ
    let affin_mat = math.multiply(point2 , math.inv(point1));
    //入手したアフィン変換行列で選択中の要素を座標変換して平行移動、拡大縮小、回転をする
    update_editgroup(affin_mat);
    //最後にハンドルの更新
    upload_handle();
  }
}


function update_TextInfoBox(){
  if(draw.select('.edit_select.ink,.edit_select.braille').members.length===1){
    let text = draw.select('.edit_select.ink,.edit_select.braille').first();
    let text_type , text_value = $('#textbox_text_info').val();
    text.hasClass('ink') ? text_type = 'ink' : text_type = 'braille';
    if(text.hasClass('ink')){
      text.plain(text_value);
    }else{
      let transed_BraText = text_value.replace(/[ァ-ン]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0x60);
      });
      text.plain(tactileGraphic().convertText(transed_BraText));//文字を点字表現に変換
      text.attr({'brailleorigintext' : transed_BraText});
    }
  }
}


//要素が占める領域（四角）の４点を取得
function get_bbox(tg_element){
  let pmin_x = 10000000 , pmax_x = -10000000;
  let pmin_y = 10000000 , pmax_y = -10000000;
  let matrix = tg_element.transform('matrix')
  let trans_matrix = [[matrix.a, matrix.c, matrix.e]
                    ,[matrix.b, matrix.d, matrix.f]
                    ,[0, 0, 1]];
  if(tg_element.hasClass('path')){
    let dpoint = tg_element.clear().array().settle(); //pathのdpoint配列を取得
    for(let j=0; j < dpoint.length; j++){
      if(dpoint[j][0] !== 'Z'){
        if(pmin_x > Number( dpoint[j][1]))pmin_x = Number( dpoint[j][1]);
        if(pmax_x < Number( dpoint[j][1]))pmax_x = Number( dpoint[j][1]);
        if(pmin_y > Number( dpoint[j][2]))pmin_y = Number( dpoint[j][2]);
        if(pmax_y < Number( dpoint[j][2]))pmax_y = Number( dpoint[j][2]);
      }
    }
  }else if(tg_element.hasClass('circle')){
    pmin_x = Number(tg_element.attr('cx')) - Number(tg_element.attr('r'));
    pmax_x = Number(tg_element.attr('cx')) + Number(tg_element.attr('r'));
    pmin_y = Number(tg_element.attr('cy')) - Number(tg_element.attr('r'));
    pmax_y = Number(tg_element.attr('cy')) + Number(tg_element.attr('r'));
  }else if(tg_element.hasClass('ink')){ //text要素
    pmin_x = Number(tg_element.attr('x'));
    pmax_x = Number(tg_element.attr('x')) + Number(tg_element.bbox().width);
    pmin_y = Number(tg_element.attr('y')) - Number(tg_element.bbox().height)/2;
    pmax_y = Number(tg_element.attr('y'));
  }else if(tg_element.hasClass('braille')){ //braille
    var corre_braille = tg_element.attr('font-size')/4; //点字が占めるエリア領域の補正量 : ikarashi braille がデフォルトでそういう仕様になっている
    pmin_x = Number(tg_element.attr('x')) + corre_braille;
    pmax_x = Number(tg_element.attr('x')) + Number(tg_element.bbox().width) - corre_braille;
    pmin_y = Number(tg_element.attr('y')) - Number(tg_element.bbox().height);
    pmax_y = Number(tg_element.attr('y'));
  }else if(tg_element.hasClass('image')){
    pmin_x = Number(tg_element.attr('x'));
    pmax_x = Number(tg_element.attr('x')) + Number(tg_element.bbox().width);
    pmin_y = Number(tg_element.attr('y'));
    pmax_y = Number(tg_element.attr('y')) + Number(tg_element.bbox().height);

  }else{
    pmin_x = Number(tg_element.attr('x'));
    pmax_x = Number(tg_element.attr('x')) + Number(tg_element.bbox().width);
    pmin_y = Number(tg_element.attr('y'))
    pmax_y = Number(tg_element.attr('y')) + Number(tg_element.bbox().height);
  }
  let position1 = [ [ pmin_x ],[ pmin_y ],[1]];
  let position2 = [ [ pmax_x ],[ pmin_y ],[1]];
  let position3 = [ [ pmin_x ],[ pmax_y ],[1]];
  let position4 = [ [ pmax_x ],[ pmax_y ],[1]];

  let trans1 = math.multiply(trans_matrix , position1);
  let trans2 = math.multiply(trans_matrix , position2);
  let trans3 = math.multiply(trans_matrix , position3);
  let trans4 = math.multiply(trans_matrix , position4);

  pmin_x = Math.min( trans1[0][0], trans2[0][0] , trans3[0][0] , trans4[0][0]);
  pmax_x = Math.max( trans1[0][0], trans2[0][0] , trans3[0][0] , trans4[0][0]);
  pmin_y = Math.min( trans1[1][0], trans2[1][0] , trans3[1][0] , trans4[1][0]);
  pmax_y = Math.max( trans1[1][0], trans2[1][0] , trans3[1][0] , trans4[1][0]);

  let bbox = new Object();
  bbox.min_x = pmin_x , bbox.max_x = pmax_x;
  bbox.min_y = pmin_y , bbox.max_y = pmax_y;
  return bbox;
}

function copy_select(){
  copy.length = 0;
  copy_gX = gX + gWidth/2;
  copy_gY = gY + gHeight/2;
  draw.select('.edit_select').each(function(i, children){
    copy.unshift(this);
  })
}

function paste_select(){
  if(copy.length > 0){
    edit_clear();
    for(let i=0;i < copy.length; i++){
      let clone = copy[i].clone().addClass('edit_select');
      clone.dmove(mx - copy_gX , my - copy_gY);
      if($('input[name="tg_mode"]:checked').val()==='Edit') clone.off('mousedown');
    }
    let current_mode = $('input[name="tg_mode"]:checked').val();
    if(current_mode==='Edit' || current_mode ==='EditImage'){
      upload_handle();
      set_SelectElement_Param();
      copy_select();
    }else{
      draw.select('.edit_select').removeClass('edit_select');
    }
    cash_svg();
  }
}

function delete_select(){
  let delete_flag = false;
  draw.select('.edit_select').each(function(i, children){
    this.remove();
    delete_flag = true;
  })
  if(delete_flag) cash_svg();
  edit_clear();
  edit_hover();
  edit_mousedown_up();
}

/**************************************************************************************
//選択状態のpathのstroke-widthを取得してテキストボックスとスライダーの値を変更する関数
//選択状態のpathが存在しない場合は変更なし、または複数存在する場合は空白にする
**********************************************************************************/
function set_SelectElement_Param(){
  /**********************
  ここから線幅、線色、線種
  ***********************/
  let strokewidth , strokecolor , dasharray_line , dasharray_space;
  draw.select('.edit_select.path').each(function(i,children){
    if(i===0){
      strokewidth = this.attr('stroke-width');
      strokecolor = this.attr('stroke');
      if(this.attr('stroke-dasharray')){
        dasharray_line = String(this.attr('stroke-dasharray')).split(/\s/)[0];
        dasharray_space = String(this.attr('stroke-dasharray')).split(/\s/)[1];
      }
      if(dasharray_line && !dasharray_space) dasharray_space = dasharray_line;
    }
    if(strokewidth === this.attr('stroke-width')){
      $('#textbox_strokewidth').val(Math.round(strokewidth/ SVG_RATIO * 10)/10);
    }else{
      $('#textbox_strokewidth').val('');
      strokewidth = -1; //-1にすることで絶対にこれ以上一致しなくなる
    }
    if(this.attr('stroke-dasharray')){
      let tmp_dasharray_line = String(this.attr('stroke-dasharray')).split(/\s/)[0];
      let tmp_dasharray_space = String(this.attr('stroke-dasharray')).split(/\s/)[1];
      if(tmp_dasharray_line && !tmp_dasharray_space) tmp_dasharray_space = tmp_dasharray_line;
      if(dasharray_line === tmp_dasharray_line && dasharray_space === tmp_dasharray_space){
        $("#radio_dotted_path").prop('checked', true);
        $('#dottedLine_line').val(Math.round(dasharray_line/ SVG_RATIO * 10)/10);
        $('#dottedLine_space').val(Math.round(dasharray_space/ SVG_RATIO * 10)/10);
        $('.dotted_option').show();
      }else{
        dasharray_line = -1;
        dasharray_space = -1;
      }
    }
    strokecolor === this.attr('stroke') ? $('#custom_stroke_color').val(strokecolor) :  strokecolor = -1;
  })

  /**********************
  ここから墨字
  ***********************/
  let ink_fontsize;
  draw.select('.edit_select.ink').each(function(i,children){
    if(i===0) ink_fontsize = this.attr('font-size');
    if(ink_fontsize === this.attr('font-size')){
      $('#textbox_resize_ink').val(Math.round(ink_fontsize/(TEXT_CORRECTION) * 10)/10);
    }else{
      $('#textbox_resize_ink').val('');
      ink_fontsize = -1; //-1にすることで絶対にこれ以上一致しなくなる
    }
  })

  /**********************
  ここから点字
  ***********************/
  let braille_fontsize;
  draw.select('.edit_select.braille').each(function(i,children){
    if(i===0) braille_fontsize = this.attr('font-size');
    if(braille_fontsize === this.attr('font-size')){
      $('#textbox_resize_braille').val(Math.round(braille_fontsize/(TEXT_CORRECTION) * 10)/10);
    }else{
      $('#textbox_resize_braille').val('');
      braille_fontsize = -1; //-1にすることで絶対にこれ以上一致しなくなる
    }
  })

  let imageOpacity;
  draw.select('.edit_select.image').each(function(i,children){
    if(i===0) imageOpacity = this.attr('opacity');
    if(imageOpacity === this.attr('opacity')){
      $('#textbox_image_opacity').val(imageOpacity*100);
    }else{
      $('#textbox_image_opacity').val('');
      imageOpacity = -1; //-1にすることで絶対にこれ以上一致しなくなる
    }
  })
}

function set_handle(){
  if(SVG.get('handle_group')!==null)SVG.get('handle_group').remove();
  var handle_group =  draw.group().attr({'id':'handle_group'});
  handle_group.hide();

  handle_group.add(draw.path().attr({
    'id':'box_resize',
    'class':'handle',
    'cursor':'move',
    'stroke-width': 2,
    'fill': 'gray',
    'stroke-dasharray': '5 5',
    'stroke': 'black',
	  'stroke-opacity': 0.8,
	  'fill-opacity': 0.1
  }))

  handle_group.add(draw.circle(SELECT_HANDLE_RADIUS).attr({
      'fill':'black',
      'id':'t_resize',
      'class':'handle',
      'cursor': 'n-resize',
  }))
  handle_group.add(draw.circle(SELECT_HANDLE_RADIUS).attr({
    'fill':'black',
    'id':'l_resize',
    'class':'handle',
    'cursor': 'e-resize'
  }))
  handle_group.add(draw.circle(SELECT_HANDLE_RADIUS).attr({
    'fill':'black',
    'id':'b_resize',
    'class':'handle',
    'cursor': 's-resize',
  }))
  handle_group.add(draw.circle(SELECT_HANDLE_RADIUS).attr({
    'fill':'black',
    'id':'r_resize',
    'class':'handle',
    'cursor': 'w-resize',
  }))
  handle_group.add(draw.circle(SELECT_HANDLE_RADIUS).attr({
    'fill':'black',
    'id':'lt_resize',
    'class':'handle',
    'cursor': 'nw-resize',
  }))
  handle_group.add(draw.circle(SELECT_HANDLE_RADIUS).attr({
    'fill':'black',
    'id':'rt_resize',
    'class':'handle',
    'cursor': 'ne-resize',
  }))
  handle_group.add(draw.circle(SELECT_HANDLE_RADIUS).attr({
    'fill':'black',
    'id':'lb_resize',
    'class':'handle',
    'cursor': 'sw-resize',
  }))
  handle_group.add(draw.circle(SELECT_HANDLE_RADIUS).attr({
    'fill':'black',
    'id':'rb_resize',
    'class':'handle',
    'cursor': 'se-resize',
  }))
  handle_group.add(draw.circle(SELECT_HANDLE_RADIUS).attr({
    'stroke':'black',
    'fill':'white',
    'id':'rot_resize',
    'class':'handle',
    'cursor' : 'url("./images/rotate.cur"),pointer'
  }))
}
