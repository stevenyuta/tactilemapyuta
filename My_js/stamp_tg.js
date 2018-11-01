function set_Stampmode(){
  let stamp_checked = $('input[name="tactileSymbol"]:checked').val();
  switch(stamp_checked){
    case 'Stair':
      add_stair();
      break;
    case 'Escalator':
      add_escalator();
      break;
    case 'Arrow':
      add_arrow();
      break;
    case 'Tiket_gate':
      add_Tiket_gate();
      break;
    case 'Reducescale':
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
    dummy_delete();
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
      'stroke': PATH_STROKE_COLOR,
      'stroke-width': PATH_STROKE_WIDTH,
      'stroke-linejoin' : 'round'
    })
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
    dummy_delete();
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
      'stroke': PATH_STROKE_COLOR,
      'stroke-width': PATH_STROKE_WIDTH,
      'stroke-linejoin' : 'round'
    })
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
    dummy_delete();
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
      'stroke': PATH_STROKE_COLOR,
      'stroke-width': PATH_STROKE_WIDTH,
      'stroke-linejoin' : 'round'
    })
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
    dummy_delete();
    let mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
    let back_num = getPathCirclePos();
    let dummy_tiket_gate1 = draw.path().M({x: mx-30, y: my}).L({x: mx-10,y:my}).addClass('dummy').back();
    let dummy_tiket_gate2 = draw.path().M({x: mx-10, y: my-10}).L({x: mx-10,y:my+10}).addClass('dummy').back();
    let dummy_tiket_gate3 = draw.path().M({x: mx, y: my-10}).L({x: mx,y:my+10}).addClass('dummy').back();
    let dummy_tiket_gate4 = draw.path().M({x: mx+10, y: my-10}).L({x: mx+10,y:my+10}).addClass('dummy').back();
    let dummy_tiket_gate5 = draw.path().M({x: mx+10, y: my}).L({x: mx+30,y:my}).addClass('dummy').back();
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
      'stroke': PATH_STROKE_COLOR,
      'stroke-width': PATH_STROKE_WIDTH,
      'stroke-linejoin' : 'round'
    })
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
    dummy_delete();
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
      'stroke': PATH_STROKE_COLOR,
      'stroke-width': PATH_STROKE_WIDTH,
      'stroke-linejoin' : 'round'
    })
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
  draw.select('.graduationFrame').each(function(i,children){
    this.remove();
  })
  let back_num = getPathCirclePos();
  let frame = draw.path().M({x: -F_WIDTH/2, y: -F_HEIGHT/2}).L({x: F_WIDTH/2,y:-F_HEIGHT/2})
                         .L({x: F_WIDTH/2, y: F_HEIGHT/2}).L({x: -F_WIDTH/2, y:F_HEIGHT/2})
                         .Z().addClass('graduationFrame').addClass('path');
  for(let i=-F_WIDTH/2; i <= F_WIDTH/2; i += F_WIDTH/4){
    draw.path().M({x: i, y: -F_HEIGHT/2}).L({x: i , y:-F_HEIGHT/2 - F_SCALE}).addClass('graduationFrame').addClass('path');
    draw.path().M({x: i, y: F_HEIGHT/2}).L({x: i , y:F_HEIGHT/2 + F_SCALE}).addClass('graduationFrame').addClass('path');
  }
  for(let i=-F_HEIGHT/2; i <= F_HEIGHT/2; i += F_HEIGHT/3){
    draw.path().M({x: -F_WIDTH/2 , y: i}).L({x: -F_WIDTH/2 - F_SCALE , y:i}).addClass('graduationFrame').addClass('path');
    draw.path().M({x: F_WIDTH/2 , y: i}).L({x: F_WIDTH/2 + F_SCALE , y:i}).addClass('graduationFrame').addClass('path');
  }

  frame.back();
  for(let i=0; i< back_num; i++){
    frame.forward();
  }
  draw.select('.graduationFrame').attr({
    'fill' : 'none',
    'stroke' : PATH_STROKE_COLOR,
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
      sx = getmousepoint('normal',e).x , sy = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
      let back_num = getPathCirclePos();
      make_circle = draw.circle(0).attr({
        'cx' : sx,
        'cy' : sy,
        'fill' : 'none',
        'stroke-width' : PATH_STROKE_WIDTH * $('#StrokeWidth_TextBox').val(),
        'stroke' : '#000000'
      })
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
          make_circle.removeClass('make_circle');
          draw.off('mousemove');
          cash_svg(); //svgデータのcash
        }
      })
    }
  })
}

/////////////////
//文字要素関係関数
/////////////////


/******************************************************
//墨字と点字をdraw_areaのマウス位置に入力する関数
******************************************************/
function add_text(){
  if($('#resizeInk_TextBox').val()==='')$('#inksize_resetbutton').click(); //resizeInk_TextBoxの値が何もない場合はリセットボタンを発火させる
  if($('#resizeBraille_TextBox').val()==='')$('#brasize_resetbutton').click(); //resizeBraille_TextBoxの値が何もない場合はリセットボタンを発火させる
  let back_ink_num = getInkPos();
  let ink_id , bra_id;
  draw.mousemove(function(e){
    dummy_delete();
    let mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
    if($('#check_ink').prop('checked')){
      let dummy_Ink_text = draw.plain( $("#InkChar").val() );
      dummy_Ink_text.attr({
        'x': mx,
        'y': my,
        'font-family': 'メイリオ',
        'font-size': $('#resizeInk_TextBox').val() * TEXT_CORRECTION,
        'fill': INK_FILL_COLOR,
        'cursor':'default'
      });
      ink_id = dummy_Ink_text.attr('id');
      dummy_Ink_text.addClass('dummy').back();
      for(let i=0; i< back_ink_num; i++){
        dummy_Ink_text.forward();
      }
    }
    if($('#check_bra').prop('checked')){
      let dummy_Bra_text = draw.plain(tactileGraphic().convertText($("#Braille").val()));//文字を点字表現に変換
      let font_family = ($('input[name="braillefont"]:checked').val()==='IBfont') ? 'Ikarashi Braille' : '点字線なし';
      let font_stroke = ($('input[name="braillefont"]:checked').val()==='IBfont') ? String(PATH_STROKE_WIDTH * 0.25) : '';
      dummy_Bra_text.attr({
        'x': mx
        ,'y': my + 30
        ,'stroke-width' :  font_stroke,
        'font-family': font_family,
        'font-size': $('#resizeBraille_TextBox').val() * TEXT_CORRECTION,
        'cursor':'default'
      })
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
          dummy_delete();
          return;
        }
      }
      if(real_Bra_text){
        if(real_Bra_text.text().match(/[^あ-んー濁小大半斜数拗１２３４５６７８９1-9＿\s]/)){
          alert("点字に使用できない文字が含まれています。");
          dummy_delete();
          return;
        }
        if( real_Bra_text.text() ==="" ){
          alert("点字に何か入力してください。");
          dummy_delete();
          return;
        }
      }
      if(real_Ink_text)real_Ink_text.removeClass('dummy').addClass('ink').addClass('SVG_Element');
      if(real_Bra_text)real_Bra_text.removeClass('dummy').addClass('braille').addClass('SVG_Element');
      if(real_Ink_text || real_Bra_text) cash_svg();


      if($('#check_bra').prop('checked')){
        let text_pairs_id = new Object();
        text_pairs_id.Braille = real_Bra_text.attr('id');
        if( $('#check_ink').prop('checked') ) text_pairs_id.Ink = real_Ink_text.attr('id');
        text_pairs.push(text_pairs_id);
      }
    }
  })
}


/******************************************************
/墨字の追加すべきレイヤー順番を示す番号を返す関数
１、画像よりも上
２、点字よりも下
３、path、円記号、墨字よりも下
の優先順位で配置する
******************************************************/
function getInkPos(){
  let position; //一番低い位置にある要素のpositon番号を格納
  draw.select(".path , .circle , .braille").each(function(i , children){
    if(position > this.position() || position === undefined) position = this.position();
  })
  let lastImage = draw.select('.image').last();
  if(lastImage){
    if(position < lastImage.position() || position === undefined) position = Number(lastImage.position()) + 1;
  }

  if(position === undefined){
    return 0;
  }else{
    return position;
  }
}

/**************************************************************************************
//選択状態の墨字のfont-sizeを取得してテキストボックスとスライダーの値を変更する関数
//選択状態の墨字が存在しない場合は変更なし、または複数存在する場合は空白にする
**********************************************************************************/
function set_textsize(){
  if(draw.select('.edit_select').first()!==null){
    let ink_flag = false, braille_flag = false;  //true: 選択状態の墨字、点字あり false: なし
    let ink_fontsize = false , braille_fontsize = false;  // 墨字、点字のサイズを格納、 false: サイズが違う文字が2つ以上あり
    draw.select('.edit_select').each(function(i,children){
      if(this.hasClass('ink')){
        if(!ink_flag){
          ink_fontsize = this.attr('font-size');
          ink_flag = true;
        }else if(ink_fontsize !== this.attr('font-size')){
          ink_fontsize = false;
        }
      }
      if(this.hasClass('braille')){
        if(!braille_flag){
          braille_fontsize = this.attr('font-size');
          braille_flag = true;
        }else if(braille_fontsize !== this.attr('font-size')){
          braille_fontsize = false;
        }
      }
    });
    if(ink_flag){
      if(!ink_fontsize){
        $('#resizeInk_TextBox').val('')
      }else{
        $("#resizeInk_Slider").slider("value",Math.round(ink_fontsize/(TEXT_CORRECTION) * 10)/10);
        $('#resizeInk_TextBox').val(Math.round(ink_fontsize/(TEXT_CORRECTION) * 10)/10)
      }
    }else{
    }
    if(braille_flag){
      if(!braille_fontsize){
        $('#resizeBraille_TextBox').val('')
      }else{
        $("#resizeBraille_Slider").slider("value",Math.round(braille_fontsize/(TEXT_CORRECTION) * 10)/10);
        $('#resizeBraille_TextBox').val(Math.round(braille_fontsize/(TEXT_CORRECTION) * 10)/10);
      }
    }else{
    }
    return;
  }else{
    return;
  }
}

/******************************************************
pathまたは円記号の追加すべきレイヤー順番を示す番号を返す関数
path（線、触知記号）、または円はレイヤー順で
１、画像よりも上
２、点字よりも下
３、path、円記号、墨字よりも上
の優先順位で配置する
******************************************************/
function getPathCirclePos(){
  let position; //一番低い位置にある要素のpositon番号を格納
  draw.select(".braille").each(function(i , children){ //点字で一番下のレイヤーにあるものの順番を取得
    if(position > this.position() || position === undefined) position = this.position();
  })
  let lastImage = draw.select('.image').last();
  if(lastImage){
    if(position < lastImage.position() || position === undefined) position = Number(lastImage.position()) + 1;
  }
  if(position === undefined){
    return 0;
  }else{
    return position;
  }
}
