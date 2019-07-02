function set_Stampmode(){
  $(document).off(); //ページ上のイベントの削
  draw.off(); //drawのイベント解除
  draw.select('.SVG_Element , .image').off(); //SVG_Elementのイベント解除
  draw.select('.SVG_Element , .image').attr({'cursor':'default'});
  set_key_down_up();
  set_contextMenu();
  reset_dcheck_element();
  set_zoom(); //zoomイベントの開始
  selector_delete('.dummy');
  let stamp_checked = $('input[name="tactileSymbol"]:checked').val();

  /** 右メニューを全て一旦隠す**/
  $('.stroke_option , .dotted_option').hide(); //線種変更
  $('.resizeInk_gadget , .resizeBraille_gadget').hide(); //墨字点字サイズ変更
  $('.gadget_imageOpacity').hide(); //画像透過度変更
  $('.layer_select , .fill_change , .resizeBox_textbox').hide(); //レイヤ、塗りつぶし、リサイズ用テキストボックス変更

  switch(stamp_checked){
    case 'Text':
      $('.resizeInk_gadget , .resizeBraille_gadget').show(); //墨字サイズ変更
      add_text(); //点字、墨字追加モード
      break;
    case 'Stair':
      $('.stroke_option').show(); //線種変更
      if($('input[name="stroke"]:checked').attr('id')==='dotted_line') $('.dotted_option').show();
      add_stair();
      break;
    case 'Escalator':
      $('.stroke_option').show(); //線種変更
      if($('input[name="stroke"]:checked').attr('id')==='dotted_line') $('.dotted_option').show();
      add_escalator();
      break;
    case 'Arrow':
      $('.stroke_option').show(); //線種変更
      if($('input[name="stroke"]:checked').attr('id')==='dotted_line') $('.dotted_option').show();
      add_arrow();
      break;
    case 'Tiket_gate':
      $('.stroke_option').show(); //線種変更
      if($('input[name="stroke"]:checked').attr('id')==='dotted_line') $('.dotted_option').show();
      add_Tiket_gate();
      break;
    case 'Reducescale':
      $('.stroke_option').show(); //線種変更
      if($('input[name="stroke"]:checked').attr('id')==='dotted_line') $('.dotted_option').show();
      add_reducescale();
      break;
    default:
      break;
  }
}

/******************************************************
//階段記号を追加すする関数
******************************************************/
function add_stair(){
  let back_num = getPathCirclePos();
  let symbol_id;
  draw.off('mousemove').mousemove(function(e){
    selector_delete('.dummy');
    mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y;//描画領域上でのマウスポイント計算
    let dummy_stair = draw.path().M({x: mx-STAIRS_BX, y: my-STAIRS_BY})
                                 .L({x: mx+STAIRS_BX, y: my})
                                 .L({x: mx-STAIRS_BX, y: my+STAIRS_BY});
    symbol_id = dummy_stair.attr('id');
    dummy_stair.addClass('dummy').back();
    for(let i=0; i< back_num; i++){
      dummy_stair.forward();
    }
    dummy_stair.attr({
      'fill': 'none',
      'stroke': $('#stroke_color').val(),
      'stroke-width' : PATH_STROKE_WIDTH*$('#StrokeWidth_TextBox').val(),
      'stroke-linejoin': 'round'
    })
    if($('input[name="stroke"]:checked').attr('id')==='dotted_line'){
      dummy_stair.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
    }
  })

  draw.off('mousedown').mousedown(function(e){
    if(e.button===0){
      let real_stair = SVG.get('#' + symbol_id).removeClass('dummy');
      if(real_stair)real_stair.addClass('stair').addClass('symbol').addClass('SVG_Element').addClass('path');
      cash_svg(); //svgデータのcash
    }
  })
}

/******************************************************
//エレベータ記号を追加すする関数
******************************************************/
function add_escalator(){
  let back_num = getPathCirclePos();
  let symbol_id;
  draw.off('mousemove').mousemove(function(e){
    selector_delete('.dummy');
    let mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
    let back_num = getPathCirclePos();
    let dummy_escalator = draw.path().M({x: mx-STAIRS_BX, y: my-STAIRS_BY})
                                     .L({x: mx+STAIRS_BX, y: my})
                                     .L({x: mx-STAIRS_BX, y: my+STAIRS_BY})
                                     .Z();
    symbol_id = dummy_escalator.attr('id');
    dummy_escalator.addClass('dummy').back();
    for(let i=0; i< back_num; i++){
      dummy_escalator.forward();
    }
    dummy_escalator.attr({
      'fill': 'none',
      'stroke': $('#stroke_color').val(),
      'stroke-width' : PATH_STROKE_WIDTH*$('#StrokeWidth_TextBox').val(),
      'stroke-linejoin': 'round'
    })
    if($('input[name="stroke"]:checked').attr('id')==='dotted_line'){
      dummy_escalator.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
    }
  })
  draw.off('mousedown').mousedown(function(e){
    if(e.button===0){
      let real_escalator = SVG.get('#' + symbol_id).removeClass('dummy');
      if(real_escalator)real_escalator.addClass('escalator').addClass('symbol').addClass('SVG_Element').addClass('path');
      cash_svg(); //svgデータのcash
    }
  })
}

/******************************************************
//矢印記号を追加すする関数
******************************************************/
function add_arrow(){
  let back_num = getPathCirclePos();
  let symbol_id;
  draw.off('mousemove').mousemove(function(e){
    selector_delete('.dummy');
    let mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
    let back_num = getPathCirclePos();
    let dummy_arrow = draw.path().M({x: mx-18, y: my}).L({x: mx+24,y:my}).L({x: mx, y: my-12}).L({x: mx+24,y:my}).L({x: mx,y:my+12});
    symbol_id = dummy_arrow.attr('id');
    dummy_arrow.addClass('dummy').back();
    for(let i=0; i< back_num; i++){
      dummy_arrow.forward();
    }
    dummy_arrow.attr({
      'fill': 'none',
      'stroke': $('#stroke_color').val(),
      'stroke-width' : PATH_STROKE_WIDTH*$('#StrokeWidth_TextBox').val(),
      'stroke-linejoin': 'round'
    })
    if($('input[name="stroke"]:checked').attr('id')==='dotted_line'){
      dummy_arrow.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
    }
  })

  draw.off('mousedown').mousedown(function(e){
    if(e.button===0){
      let real_arrow = SVG.get('#' + symbol_id).removeClass('dummy');
      if(real_arrow)real_arrow.addClass('arrow').addClass('symbol').addClass('SVG_Element').addClass('path');
      cash_svg(); //svgデータのcash
    }
  })
}

/******************************************************
//改札記号を追加する関数
******************************************************/
function add_Tiket_gate(){
  let back_num = getPathCirclePos();
  let symbol_id = new Array();
  draw.off('mousemove').mousemove(function(e){
    selector_delete('.dummy');
    let mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
    let back_num = getPathCirclePos();
    let dummy_tiket_gate1 = draw.path().M({x: mx-40, y: my}).L({x: mx-15,y:my}).addClass('dummy').back();
    let dummy_tiket_gate2 = draw.path().M({x: mx-15, y: my-15}).L({x: mx-15,y:my+15}).addClass('dummy').back();
    let dummy_tiket_gate3 = draw.path().M({x: mx, y: my-15}).L({x: mx,y:my+15}).addClass('dummy').back();
    let dummy_tiket_gate4 = draw.path().M({x: mx+15, y: my-15}).L({x: mx+15,y:my+15}).addClass('dummy').back();
    let dummy_tiket_gate5 = draw.path().M({x: mx+15, y: my}).L({x: mx+40,y:my}).addClass('dummy').back();
    symbol_id[0] = dummy_tiket_gate1.attr('id');
    symbol_id[1] = dummy_tiket_gate2.attr('id');
    symbol_id[2] = dummy_tiket_gate3.attr('id');
    symbol_id[3] = dummy_tiket_gate4.attr('id');
    symbol_id[4] = dummy_tiket_gate5.attr('id');
    for(let i=0; i< back_num; i++){
      dummy_tiket_gate1.forward();
      dummy_tiket_gate2.forward();
      dummy_tiket_gate3.forward();
      dummy_tiket_gate4.forward();
      dummy_tiket_gate5.forward();
    }
    draw.select('.dummy').attr({
      'fill': 'none',
      'stroke': $('#stroke_color').val(),
      'stroke-width' : PATH_STROKE_WIDTH*$('#StrokeWidth_TextBox').val(),
      'stroke-linejoin': 'round'
    })
    if($('input[name="stroke"]:checked').attr('id')==='dotted_line'){
      draw.select('.dummy').attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
    }
  })

  draw.off('mousedown').mousedown(function(e){
    if(e.button===0){
      for(let i=0; i < symbol_id.length; i++){
        let real_tiket_gate = SVG.get('#' + symbol_id[i]).removeClass('dummy');
        if(real_tiket_gate)real_tiket_gate.addClass('connected').addClass('SVG_Element').addClass('path');
      }
      cash_svg(); //svgデータのcash
    }
  })
}

/******************************************************
//縮尺記号を追加すする関数
******************************************************/

function add_reducescale(){
  let back_num = getPathCirclePos();
  let symbol_id = new Array();
  draw.off('mousemove').mousemove(function(e){
    selector_delete('.dummy');
    let mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
    let back_num = getPathCirclePos();
    let dummy_scale = draw.path().M({x: mx-45, y: my}).L({x: mx-45,y:my-15}).L({x: mx-45, y: my+15}).L({x: mx-45,y:my})
                                 .L({x: mx+45, y: my}).L({x: mx+45,y:my-15}).L({x: mx+45, y: my+15}).L({x: mx+45,y:my});
    symbol_id = dummy_scale.attr('id');
    dummy_scale.addClass('dummy').back();
    for(let i=0; i< back_num; i++){
      dummy_scale.forward();
    }
    dummy_scale.attr({
      'fill': 'none',
      'stroke': $('#stroke_color').val(),
      'stroke-width' : PATH_STROKE_WIDTH*$('#StrokeWidth_TextBox').val(),
      'stroke-linejoin': 'round'
    })
    if($('input[name="stroke"]:checked').attr('id')==='dotted_line'){
      dummy_scale.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
    }
  })

  draw.off('mousedown').mousedown(function(e){
    if(e.button===0){
      let real_scale = SVG.get('#' + symbol_id).removeClass('dummy');
      if(real_scale)real_scale.addClass('scale').addClass('symbol').addClass('SVG_Element').addClass('path');
      cash_svg(); //svgデータのcash
    }
  })
}

/******************************************************
//目盛り枠を追加すする関数
******************************************************/

function add_graduationFrame(){
  if(SVG.get('.graduationFrame_group'))SVG.get('.graduationFrame_group').remove();

  let back_num = getPathCirclePos();
  let Frame_group = draw.group().id('graduationFrame_group');
  let frame = Frame_group.path().M({x: -F_WIDTH/2, y: -F_HEIGHT/2}).L({x: F_WIDTH/2,y:-F_HEIGHT/2})
                         .L({x: F_WIDTH/2, y: F_HEIGHT/2}).L({x: -F_WIDTH/2, y:F_HEIGHT/2})
                         .Z().addClass('graduationFrame').addClass('path').id('mainFrame');
  for(let i=-F_WIDTH/2; i <= F_WIDTH/2; i += F_WIDTH/4){
    Frame_group.path().M({x: i, y: -F_HEIGHT/2}).L({x: i , y:-F_HEIGHT/2 - F_SCALE}).addClass('graduationFrame').addClass('path');
    Frame_group.path().M({x: i, y: F_HEIGHT/2}).L({x: i , y:F_HEIGHT/2 + F_SCALE}).addClass('graduationFrame').addClass('path');
  }
  for(let i=-F_HEIGHT/2; i <= F_HEIGHT/1.5; i += F_HEIGHT/3){
    Frame_group.path().M({x: -F_WIDTH/2 , y: i}).L({x: -F_WIDTH/2 - F_SCALE , y:i}).addClass('graduationFrame').addClass('path');
    Frame_group.path().M({x: F_WIDTH/2 , y: i}).L({x: F_WIDTH/2 + F_SCALE , y:i}).addClass('graduationFrame').addClass('path');
  }

  Frame_group.back();
  for(let i=0; i< back_num; i++){
    Frame_group.forward();
  }
  draw.select('.graduationFrame').attr({
    'fill' : 'none',
    'stroke-width': PATH_STROKE_WIDTH
  })
}


/******************************************************
//円を生成する関数
******************************************************/
function draw_circle(){
  let sx = 0 , sy = 0;
  let lx = 0 , ly = 0;
  let make_circle;
  draw.off('mousedown').on('mousedown', function(e){
    if(e.button===0){
      //StrokeWidth_TextBoxの値が何もないまたは0の場合はリセットボタンを発火させる
      if($('#StrokeWidth_TextBox').val()==='') $('#resetStrokeWidth_Button').click();
      if($('#StrokeWidth_TextBox').val()==='0' && $('input[name="draw_line_fillRadio"]:checked').val()==='none') $('#resetStrokeWidth_Button').click();
      sx = getmousepoint('normal',e).x , sy = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
      let back_num = getPathCirclePos();
      make_circle = draw.circle(0).attr({
        'cx' : sx,
        'cy' : sy,
        'fill': $('input[name="draw_line_fillRadio"]:checked').val(),
        'stroke-width' : PATH_STROKE_WIDTH * $('#StrokeWidth_TextBox').val(),
        'stroke' : $('#stroke_color').val()
      })
      if($('input[name="draw_line_fillRadio"]:checked').val()==='custom') make_circle.fill($('#draw_fill_color').val());
      if($('input[name="stroke"]:checked').attr('id')==='dotted_line'){
        make_circle.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
      }
      make_circle.addClass('SVG_Element').addClass('circle').addClass('make_circle').back();
      for(let i=0; i< back_num; i++){
        make_circle.forward();
      }

      draw.off('mousemove').on('mousemove', function(e){
        lx = getmousepoint('normal',e).x , ly = getmousepoint('normal',e).y //描画領域上でのマウスポイント計算
        let radius = Math.sqrt((sx-lx)*(sx-lx) + (sy-ly)*(sy-ly));
        make_circle.attr({ 'r' : radius });
      })

      draw.off('mouseup').on('mouseup', function(e){
        if(e.button===0){
          if(make_circle.attr('r') > 2 * SVG_RATIO){
            make_circle.removeClass('make_circle');
            cash_svg(); //svgデータのcash
          }else{
            make_circle.remove();
          }
          draw.off('mousemove');
        }
      })
    }
  })
}


/******************************************************
//矩形を生成する関数
******************************************************/
function draw_rect(){
  let sx = 0 , sy = 0;
  let lx = 0 , ly = 0;
  let make_path;
  draw.off('mousedown').on('mousedown', function(e){
    if(e.button===0){
      //StrokeWidth_TextBoxの値が何もないまたは0の場合はリセットボタンを発火させる
      if($('#StrokeWidth_TextBox').val()==='') $('#resetStrokeWidth_Button').click();
      if($('#StrokeWidth_TextBox').val()==='0' && $('input[name="draw_line_fillRadio"]:checked').val()==='none') $('#resetStrokeWidth_Button').click();
      sx = getmousepoint('normal',e).x , sy = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
      let back_num = getPathCirclePos();
      make_path = draw.path().attr({
        'fill': $('input[name="draw_line_fillRadio"]:checked').val(),
        'stroke-width' : PATH_STROKE_WIDTH * $('#StrokeWidth_TextBox').val(),
        'stroke' : $('#stroke_color').val(),
        'stroke-linejoin': 'round'
      })
      if($('input[name="draw_line_fillRadio"]:checked').val()==='custom') make_path.fill($('#draw_fill_color').val());
      if($('input[name="stroke"]:checked').attr('id')==='dotted_line'){
        make_path.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
      }
      make_path.addClass('connected').addClass('SVG_Element').addClass('path').back();
      for(let i=0; i< back_num; i++){
        make_path.forward();
      }
      draw.off('mousemove').on('mousemove', function(e){
        lx = getmousepoint('normal',e).x , ly = getmousepoint('normal',e).y //描画領域上でのマウスポイント計算
        if(input_key_buffer[16] || input_key_buffer[17]){
          ((lx-sx) * (ly-sy) < 0) ? lx = sx - (ly - sy) : lx = sx + ly - sy;
        }
        make_path.attr({'d':''})
        if(Math.abs(lx - sx) > 3 && Math.abs(ly - sy) > 3) make_path.M({x: sx, y: sy}).L({x: lx, y: sy}).L({x: lx, y: ly}).L({x: sx, y: ly}).Z();
      })
      draw.off('mouseup').on('mouseup', function(e){
        if(e.button===0){
          if(make_path.attr('d')===""){
            make_path.remove();
          }else{
            cash_svg(); //svgデータのcash
            draw.off('mousemove');
          }
        }
      })
    }
  })
}

/******************************************************
//墨字と点字をdraw_areaのマウス位置に入力する関数
******************************************************/
function add_text(){
  if($('#resizeInk_TextBox').val()==='')$('#inksize_resetbutton').click(); //resizeInk_TextBoxの値が何もない場合はリセットボタンを発火させる
  if($('#resizeBraille_TextBox').val()==='')$('#brasize_resetbutton').click(); //resizeBraille_TextBoxの値が何もない場合はリセットボタンを発火させる
  let back_ink_num = getInkPos();
  let ink_id , bra_id;
  draw.mousemove(function(e){
    selector_delete('.dummy');
    let mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
    if($('#check_ink').prop('checked')){
      let dummy_Ink_text = draw.plain( $("#InkChar").val() );
      dummy_Ink_text.attr({
        'font-family': 'メイリオ',
        'font-size': $('#resizeInk_TextBox').val() * TEXT_CORRECTION,
        'fill': INK_FILL_COLOR,
        'cursor':'default'
      }).translate(mx,my);
      ink_id = dummy_Ink_text.attr('id');
      dummy_Ink_text.addClass('dummy').back();
      for(let i=0; i< back_ink_num; i++){
        dummy_Ink_text.forward();
      }
    }
    if($('#check_bra').prop('checked')){
      let transed_BraText = $("#Braille").val().replace(/[ァ-ン]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0x60);
      });
      let dummy_Bra_text = draw.plain(tactileGraphic().convertText(transed_BraText));//文字を点字表現に変換
      let font_family = ($('input[name="braillefont"]:checked').attr('id')==='IBfont') ? 'Ikarashi Braille' : '点字線なし';
      let font_stroke = ($('input[name="braillefont"]:checked').attr('id')==='IBfont') ? String(PATH_STROKE_WIDTH * 0.25) : '';
      dummy_Bra_text.attr({
        'stroke-width' :  font_stroke,
        'font-family': font_family,
        'font-size': $('#resizeBraille_TextBox').val() * TEXT_CORRECTION,
        'brailleorigintext' : transed_BraText,
        'cursor':'default'
      }).translate(mx,my + 30)
      bra_id = dummy_Bra_text.attr('id');
      dummy_Bra_text.addClass('dummy');
    }
  })

  draw.mousedown(function(e){
    if(e.button===0){ //←クリック時
      let real_Ink_text = SVG.get('#' + ink_id) , real_Bra_text = SVG.get('#' + bra_id);
      if(real_Ink_text){
        if(  real_Ink_text.text() ==="" ){
          alert("墨字に何か入力してください。");
          selector_delete('.dummy');
          return;
        }
      }
      if(real_Bra_text){
        if( real_Bra_text.text() ==="" ){
          alert("点字に何か入力してください。");
          selector_delete('.dummy');
          return;
        }
      }
      if(real_Ink_text)real_Ink_text.removeClass('dummy').addClass('ink').addClass('SVG_Element');
      if(real_Bra_text)real_Bra_text.removeClass('dummy').addClass('braille').addClass('SVG_Element');
      if(real_Ink_text || real_Bra_text) cash_svg();
    }
  })
}


/******************************************************
/墨字の追加すべきレイヤー順番を示す番号を返す関数
1、画像よりも上
2、塗りつぶされたpathよりも上
3、点字よりも下
4、墨字よりも上
5、path、円記号よりも下
の優先順位で配置する
******************************************************/
function getInkPos(){
  let position; //一番低い位置にある要素のpositon番号を格納
  draw.select(".path , .circle").each(function(i , children){
    if(position > this.position() || position === undefined) position = this.position();
  })
  draw.select(".ink").each(function(i , children){
    if(position < this.position() || position === undefined) position = this.position() + 1;
  })
  draw.select(".braille").each(function(i , children){
    if(position > this.position() || position === undefined) position = this.position();
  })
  draw.select('.path:not([fill="none"])').each(function(i , children){
    if(position <= this.position() || position === undefined) position = this.position() + 1;
  })
  draw.select(".image").each(function(i , children){
    if(position <= this.position() || position === undefined) position = this.position() + 1;
  })
  if(position === undefined){
    return 0;
  }else{
    return position;
  }
}

/******************************************************
pathまたは円記号の追加すべきレイヤー順番を示す番号を返す関数
path（線、触知記号）、または円はレイヤー順で
1、画像よりも上
2、path、円記号よりも上
3、点字よりも下
4、墨字よりも上
の優先順位で配置する
******************************************************/
function getPathCirclePos(){
  let position; //一番低い位置にある要素のpositon番号を格納
  draw.select(".ink").each(function(i , children){
    if(position < this.position() || position === undefined) position = Number(this.position()) + 1;
  })
  draw.select(".braille").each(function(i , children){ //点字で一番下のレイヤーにあるものの順番を取得
    if(position > this.position() || position === undefined) position = this.position();
  })
  draw.select(".path , .circle").each(function(i , children){
    if(position < this.position() || position === undefined) position = this.position() + 1;
  })
  draw.select(".image").each(function(i , children){
    if(position < this.position() || position === undefined) position = Number(this.position()) + 1;
  })
  if(position === undefined){
    return 0;
  }else{
    return position;
  }
}
