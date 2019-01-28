/******************************************************
/右クリックメニューの設定関数
******************************************************/
function set_contextMenu(){
  $.contextMenu('destroy');
  $.contextMenu({
    selector: '#draw_area',
    zIndex: 5,
    callback: function(key, options) {
      switch(key){
        case 'undo':
          undo();
          break;
        case 'redo':
          redo();
          break;
        case 'copy':
          copy_select();
          break;
        case 'paste':
          paste_select();
          break;
        case 'delete':
          if($('input[name="tg_mode"]:checked').val()==="Edit" || $('input[name="tg_mode"]:checked').val()==="EditImage")delete_select();
          if($('input[name="tg_mode"]:checked').val()==="EditPath")delete_editpath();
          break;
        case 'draw_end':
          draw_end_function();
          break;
        case 'node_connect':
          node_connect_function();
          break;
        case 'verhor':
          verhor_fragmentedPath();
          break;
        default:
      }
    },
    items: {
      "undo":{
        name: "元に戻す",
        icon: "fa-undo",
        disabled: function(){
          let flag;
          (cash_array.length > cash_pointer + 1) ? flag = false : flag = true;
          return flag;
        }
      },
      "redo":{
        name: "やり直す",
        icon: "fa-repeat",
        disabled: function(){
          let flag;
          (cash_pointer > 0) ? flag = false : flag = true;
          return flag;
        }
      },
      "copy":{
        name: "コピー",
        icon: "copy",
        disabled: function(){
          let flag;
          (draw.select('.edit_select').first()) ? flag = false : flag = true;
          return flag;
        }
      },
      "paste":{
        name: "貼り付け",
        icon: "paste" ,
        disabled: function(){
          let flag;
          (copy_elements.length===0) ? flag = true : flag = false;
          return flag;
        }
      },
      "delete":{
        name: '削除',
        icon: 'fa-times',
        disabled: function(){
          let flag;
          (draw.select('.edit_select , .editing_target').first()) ? flag = false : flag =  true;
          return flag;
        }
      },
      "sep1": "---------",
      "draw_end":{
        name: '線の描画終了',
        icon: 'fa-pencil',
        disabled: function(){
          let flag;
          (draw.select('.drawing_path').first()) ? flag = false : flag = true;
          return flag;
        }
      },
      "node_connect":{
        name: '端点のノードを結合',
        icon: 'fa-compress',
        disabled: function(){
          let connectRect = get_node_connectRect();
          let flag;
          (connectRect.rect1 && connectRect.rect2) ? flag = false : flag =  true;
          return flag;
        }
      },
      "verhor":{
        name: '線の垂直・水平化',
        icon: 'fa-wrench',
        disabled: function(){
          let editing_target_flag;
          (draw.select('.editing_target.fragmented').first()) ? editing_target_flag = false : editing_target_flag = true;
          return editing_target_flag;
        }
      }
    }
  })
}

/******************************************************
/点字フォントラジオボタンの初期設定関数
******************************************************/
function braillefont_set(){
  $('input[name="braillefont"]:radio').off('change').on('change',function(){ //ラジオボタン変更時の処理
    let font_family = ($('input[name="braillefont"]:checked').val()==='IBfont') ? 'Ikarashi Braille' : '点字線なし'; //点字フォントの指定
    //いからし点字の場合は0.25mmの黒線を輪郭とする
    let font_strokewidth = ($('input[name="braillefont"]:checked').val()==='IBfont') ? String(PATH_STROKE_WIDTH * 0.25) : '';
    let font_strokecolor = ($('input[name="braillefont"]:checked').val()==='IBfont') ? '#000000' : 'none';
    draw.select('.braille').attr({
      'font-family': font_family,
      'stroke': font_strokecolor,
      'stroke-width': font_strokewidth
    })
  })
  $("#IBfont").prop('checked', true).change();//初期状態はいからし点字にチェックを入れておく
}

/******************************************************
/線種変更ラジオボタンの初期設定関数
******************************************************/
function stroke_radio_set(){
  $('input[name="stroke"]:radio').off('change').on('change',function(){ //ラジオボタン変更時の処理
    if($(this).val()==='solid_line'){ //実線の場合
      draw.select('.edit_select , .fragmented , .drawing_path').each(function(i,children){
        if(!this.hasClass('ink') && !this.hasClass('braille') && !this.hasClass('image'))  this.attr({'stroke-dasharray': ''});
      })
    }else{ //点線の場合
      draw.select('.edit_select , .fragmented , .drawing_path').each(function(i,children){
        if(!this.hasClass('ink') && !this.hasClass('braille') && !this.hasClass('image'))  this.attr({'stroke-dasharray': PS_WIDTH * $('#StrokeWidth_TextBox').val()});
      })
    }
  })
  $("#solid_line").prop('checked', true).change();//初期状態は実線にチェックを入れておく
}

/******************************************************
//グリッド線を描画する関数
******************************************************/
function draw_gridline(range_x,range_y,interval_x,interval_y){
  if(SVG.get('gridline_group')) SVG.get('gridline_group').remove();
  let gridline_group =  draw.group().attr({ id: 'gridline_group' }).front(); //グリッド線のグループ
  for(let i=-range_x; i<=range_x; i+=interval_x){
    let line = draw.line(i, range_y, i, -range_y).attr({ 'stroke-width': 0.3 });
    gridline_group.add(line);
  }
  for(let i=-range_y; i<=range_y; i+=interval_y){
    let line = draw.line(range_x, i, -range_x, i).attr({ 'stroke-width': 0.3 });
    gridline_group.add(line);
  }
  if(!$('#gridline').prop('checked')) gridline_group.attr({'display':'none'});
}

/******************************************************
//A4、B4枠を描画する関数
******************************************************/
function draw_guiderect(){
  if(SVG.get('guiderect_group')===null){
    let guiderect_group = draw.group().attr({ id: 'guiderect_group' }).back();
    let guiderectA4 = draw.rect(GUIDE_WIDTH_A4 + 2 * GUIDE_STROKE_WIDTH , GUIDE_HEIGHT_A4 + 2 * GUIDE_STROKE_WIDTH);
    guiderectA4.addClass('guiderect').addClass('A4').front();
    guiderectA4.attr({
      'x' : -GUIDE_WIDTH_A4/2 - GUIDE_STROKE_WIDTH,
      'y' : -GUIDE_HEIGHT_A4/2 - GUIDE_STROKE_WIDTH,
      'fill':'none', 'stroke': GUIDE_STROKE_COLOR_A4, 'stroke-width': GUIDE_STROKE_WIDTH
    });
    guiderect_group.add(guiderectA4);

    let guiderectB4 = draw.rect(GUIDE_WIDTH_B4 + 2 * GUIDE_STROKE_WIDTH , GUIDE_HEIGHT_B4 + 2 * GUIDE_STROKE_WIDTH);
    guiderectB4.addClass('guiderect').addClass('B4').front();
    guiderectB4.attr({
      'x': -GUIDE_WIDTH_B4 / 2 - GUIDE_STROKE_WIDTH,
      'y': -GUIDE_HEIGHT_B4 / 2 - GUIDE_STROKE_WIDTH, //x,y座標の設定
      'fill':'none', 'stroke': GUIDE_STROKE_COLOR_B4, 'stroke-width': GUIDE_STROKE_WIDTH
    });
    guiderect_group.add(guiderectB4);
  }
  if($( 'input[name="guiderect"]:checked' ).val() === 'guiderect_A4'){
      draw.select('.A4').show();
      draw.select('.B4').hide();
  }else{
      draw.select('.A4').show();
      draw.select('.B4').hide();
  }
  if($( 'input[name="direction_guide"]:checked' ).val() === 'horizontal_guide'){
    draw.select('.A4').transform({rotation:0});
    draw.select('.B4').transform({rotation:0});
  }else{
    draw.select('.A4').transform({rotation:90});
    draw.select('.B4').transform({rotation:90});
  }
}

/******************************************************
/チェックボックスを設定する関数
******************************************************/
function checkbox_set(){
  $("#check_ink").prop('checked', true).change();//初期状態はチェックを入れておく
  $("#check_bra").prop('checked', true).change();//初期状態はチェックを入れておく
  /**************************************************
  //SVG要素の表示非表示機能をチェックボックスと連結
  ***************************************************/
  $('#display_DrawElement').off('change').change( function() {
    if($('#display_DrawElement').prop('checked')){
      draw.select('.SVG_Element').each(function(i , children){
        if(!this.hasClass('graduationFrame')) this.show();
      })
    }else{
      draw.select('.SVG_Element').each(function(i , children){
        if(!this.hasClass('graduationFrame')) this.hide();
      })
    }
  })
  $("#display_DrawElement").prop('checked', true).change();//初期状態はチェックを入れておく
  /**************************************************
  //原図の表示非表示機能をチェックボックスと連結
  ***************************************************/
  $('#image').off('change').change( function() {
    ($('#image').prop('checked')) ? SVG.select('.image').show() : SVG.select('.image').hide();
  })
  $("#image").prop('checked', true).change();//初期状態はチェックを入れておく
  /**************************************************
  //グリッド線の表示非表示機能をチェックボックスと連結
  ***************************************************/
  $('#gridline').off('change').change( function() {
    ($('#gridline').prop('checked')) ? SVG.get('gridline_group').attr({'display':'inline'}) : SVG.get('gridline_group').attr({'display':'none'});
  })
  $("#gridline").prop('checked', false).change();//初期状態はチェックを入れておく
  /**************************************************
  //点字の日本語変換機能をチェックボックスと連結
  ***************************************************/
  $('#2Braille').off('change').change( function() {
    let font_family = ($('input[name="braillefont"]:checked').val()==='IBfont') ? 'Ikarashi Braille' : '点字線なし';
    ($('#2Braille').prop('checked')) ? draw.select('.braille').attr({'font-family':'メイリオ'}) : draw.select('.braille').attr({'font-family':font_family});
  })
  $("#2Braille").prop('checked', false).change();//初期状態はチェックを入れないでおく

  /**************************************************
  //目盛り枠の表示、非表示
  ***************************************************/
  $('#graduation_frame').off('change').change( function() {
    if(!SVG.get('graduationFrame_group')) add_graduationFrame();
    if($('#graduation_frame').prop('checked')){
      SVG.get('graduationFrame_group').show();
    }else{
      SVG.get('graduationFrame_group').hide();
    }
  })
  $("#graduation_frame").prop('checked', false).change();//初期状態はチェックを入れないでおく

  /**************************************************
  //ガイドの表示非表示チェックボックス
  ***************************************************/
  $( 'input[name="guiderect"]:radio' ).change( function() {
    var radioval = $(this).val();
    if(radioval === 'guiderect_A4'){
      draw.select('.A4').show();
      draw.select('.B4').hide();
    }else{
      draw.select('.B4').show();
      draw.select('.A4').hide();
    }
  })

  $('input[name=guiderect]').val(['guiderect_A4']);
  draw.select('.A4').show();
  draw.select('.B4').hide();

  $( 'input[name="direction_guide"]:radio' ).change( function() {
    var radioval = $(this).val();
    if(radioval === 'horizontal_guide'){
      draw.select('.A4').transform({rotation:0});
      draw.select('.B4').transform({rotation:0});
      SVG.get('graduationFrame_group').transform({rotation:0});
    }else{
      draw.select('.A4').transform({rotation:90});
      draw.select('.B4').transform({rotation:90});
      SVG.get('graduationFrame_group').transform({rotation:90});
    }
  })
  $('input[name=direction_guide]').val(['horizontal_guide'])
  draw.select('.A4').transform({rotation:0});
  draw.select('.B4').transform({rotation:0});
  SVG.get('graduationFrame_group').transform({rotation:0});
}

function checkBox_change(){
  //SVG要素
  if($('#display_DrawElement').prop('checked')){
    draw.select('.SVG_Element').each(function(i , children){
      if(!this.hasClass('graduationFrame')) this.show();
    })
  }else{
    draw.select('.SVG_Element').each(function(i , children){
      if(!this.hasClass('graduationFrame')) this.hide();
    })
  }
  //原図
  ($('#image').prop('checked')) ? SVG.select('.image').show() : SVG.select('.image').hide();
  //グリッド線
  ($('#gridline').prop('checked')) ? SVG.get('gridline_group').attr({'display':'inline'}) : SVG.get('gridline_group').attr({'display':'none'});
  //点訳
  let font_family = ($('input[name="braillefont"]:checked').val()==='IBfont') ? 'Ikarashi Braille' : '点字線なし';
  ($('#2Braille').prop('checked')) ? draw.select('.braille').attr({'font-family':'メイリオ'}) : draw.select('.braille').attr({'font-family':font_family});

  //ガイドの四角形がA4かB4か
  var radioval = $( 'input[name="guiderect"]:checked' ).val();
  if(radioval === 'guiderect_A4'){
    draw.select('.A4').show();
    draw.select('.B4').hide();
  }else{
    draw.select('.B4').show();
    draw.select('.A4').hide();
  }
  //ガイドの四角形が横か縦か
  var radioval = $( 'input[name="direction_guide"]:checked' ).val()
  if(radioval === 'horizontal_guide'){
    draw.select('.A4').transform({rotation:0});
    draw.select('.B4').transform({rotation:0});
  }else{
    draw.select('.A4').transform({rotation:90});
    draw.select('.B4').transform({rotation:90});
  }
}

/******************************************************
//描画領域上のズーム機能
******************************************************/
function set_zoom(){
  draw.panZoom({ //zoomの導入
    doPanning: false,
    zoomFactor: 0.2,
    zoomMin: 0.35,
    zoomMax: 5
  })
  let mousewheelevent = 'onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll';
  $('#draw_area').off(mousewheelevent).on(mousewheelevent,function(e){
    e.preventDefault();
    let zoom_lvl = draw.zoom();
    let vb = draw.viewbox();
    viewbox_x = vb.x , viewbox_y = vb.y
    widthScrollBar_ratio = (4000 - draw.viewbox().width)/940;
    widthScrollBar_center = 2000 + draw.viewbox().x;

    heightScrollBar_ratio = (4000 - draw.viewbox().height)/635;
    heightScrollBar_center = 2000 + draw.viewbox().y;

    if(widthScrollBar_center/widthScrollBar_ratio <= 0){
      draw.viewbox(-2000 , vb.y , vb.width , vb.height);
      SVG.get('width_handle').attr({'x' : 0});
    }else if(widthScrollBar_center/widthScrollBar_ratio >= 940){
      draw.viewbox(2000 - vb.width , vb.y , vb.width , vb.height);
      SVG.get('width_handle').attr({'x' : 940});
    }else{
      SVG.get('width_handle').attr({'x' : widthScrollBar_center/widthScrollBar_ratio});
    }

    if(heightScrollBar_center/heightScrollBar_ratio <= 0){
      draw.viewbox(vb.x , -2000 , vb.width , vb.height);
      SVG.get('height_handle').attr({'y' : 0});
    }else if(heightScrollBar_center/heightScrollBar_ratio >= 635){
      draw.viewbox(vb.x , 2000 - vb.height , vb.width , vb.height);
      SVG.get('height_handle').attr({'y' : 2000});
    }else{
      SVG.get('height_handle').attr({'y' : heightScrollBar_center/heightScrollBar_ratio});
    }

    let gY = 0;
    SVG.get('handle_group').each(function(i , children){
      if(this.type === 'rect') gY = this.attr('y');
      if(this.type === 'circle') this.radius(HANDLE_CIRCLE_RADIUS/(2*zoom_lvl));
      if(this.attr('id') === 'rot_resize') this.attr({'cy' : gY - 15/zoom_lvl});
    })

    draw.select('.svg_select_points').attr({'r':HANDLE_CIRCLE_RADIUS/(2*zoom_lvl)});
    draw.select('.svg_select_points_rot').attr({ 'r':HANDLE_CIRCLE_RADIUS/(2*zoom_lvl) });

    SVG.select('.edit_rect , .close_node').each(function(i , children){
      let origi_cx = this.x() + this.width()/2 , origi_cy = this.y() + this.height()/2;
      this.width(RECT_WIDTH/(1.5*zoom_lvl));
      this.height(RECT_HEIGHT/(1.5*zoom_lvl));
      this.attr({'x' : origi_cx - this.width()/2, 'y' : origi_cy - this.height()/2 });
    })
    SVG.select('.init_node , .last_node').each(function(i , children){
      let origi_cx = this.x() + this.width()/2 , origi_cy = this.y() + this.height()/2;
      this.width(RECT_WIDTH/(2.5*zoom_lvl));
      this.height(RECT_HEIGHT/(2.5*zoom_lvl));
      this.attr({'x' : origi_cx - this.width()/2, 'y' : origi_cy - this.height()/2 });
    })
  });
}

//////////////////////////////////////////////////////////
//スクロールスライダー、墨字点字、線幅変更用ガジェットの初期設定
//////////////////////////////////////////////////////////
function gadget_set(e){
  /*****************************************
  描画領域の上下左右スクロールスライダー
  ******************************************/
  /*svg_width_scrollbarの設定*/
  let width_scrollbar = SVG('svg_width_scrollbar').size(1040,10).attr('id','width_scrollbar');
  width_scrollbar.rect(1040, 10).stroke('#000000').fill('#ffffff');
  let width_handle = width_scrollbar.rect(100, 10).attr({
    'x' : 470,'id' : 'width_handle',
    'fill' : '#3399ff','cursor' : 'pointer'
  })
  width_handle.draggable({minX: 0, minY: 0, maxX: 1040, maxY: 10});

  widthScrollBar_ratio = (4000 - draw.viewbox().width)/940;
  widthScrollBar_center = widthScrollBar_ratio*470;

  width_handle.on('dragmove.namespace', function(event){
    let viewbox = draw.viewbox();
    let move = widthScrollBar_ratio*Number(this.attr('x')) - widthScrollBar_center + viewbox_x;
    draw.viewbox(move, viewbox.y, viewbox.width, viewbox.height);
  })

  /*svg_height_scrollbarの設定*/
  let height_scrollbar = SVG('svg_height_scrollbar').size(10,735).attr('id','height_scrollbar');
  height_scrollbar.rect(10,735).stroke('#000000').fill('#ffffff');
  let height_handle = height_scrollbar.rect(10, 100).attr({
    'y' : 317.5,'id' : 'height_handle',
    'fill' : '#3399ff','cursor' : 'pointer'
  })
  height_handle.draggable({ minX: 0, minY: 0,  maxX: 10, maxY: 735 });
  heightScrollBar_ratio = (4000 - draw.viewbox().height)/635;
  heightScrollBar_center = heightScrollBar_ratio*317.5;

  height_handle.on('dragmove.namespace', function(event){
    let viewbox = draw.viewbox();
    let move = heightScrollBar_ratio*Number(this.attr('y')) - heightScrollBar_center + viewbox_y;
    draw.viewbox(viewbox.x, move, viewbox.width, viewbox.height);
  })

  /************************************************************
  線幅を変更するテキストボックス、リセットボタン、スライダーの設定
  *************************************************************/
  $('#StrokeWidth_TextBox').off('focusout').on('focusout' , update_StrokeWidth_TextBox);
  $('#StrokeWidth_TextBox').val(1); //線幅の初期値を指定

  $('#resetStrokeWidth_Button').click(function(){  //線幅リセットボタンを押下時の処理
    $("#StrokeWidth_Slider").slider("value" , 1);
    $("#StrokeWidth_TextBox").val(1);
    draw.select('.edit_select , .fragmented , .drawing_path').each(function(i,children){
      if(!this.hasClass('ink') && !this.hasClass('braille')){
        this.attr({'stroke-width':PATH_STROKE_WIDTH});
        if(this.attr('stroke-dasharray')!== undefined && this.attr('stroke-dasharray')!=='') this.attr({'stroke-dasharray':PATH_STROKE_WIDTH});
      }
    })
  });
  //線幅変更スライダーの設定
  $("#StrokeWidth_Slider").slider({
    max:5, //最大値
    min:0, //最小値
    value: 1, //初期値
    step: 0.1, //幅
    slide: function( event, ui ) {
      draw.select('.edit_select , .fragmented , .drawing_path').each(function(i,children){
        if(!this.hasClass('ink') && !this.hasClass('braille')){
          this.attr({'stroke-width':PATH_STROKE_WIDTH * ui.value});
          if(this.attr('stroke-dasharray')!==undefined && this.attr('stroke-dasharray')!=='') this.attr({'stroke-dasharray':PATH_STROKE_WIDTH*ui.value});
        }
      });
      $('#StrokeWidth_TextBox').val(ui.value);
    }
  });

  /**************************************************************
  //墨字を変更するテキストボックス、リセットボタン、スライダーの設定
  **************************************************************/
  $('#resizeInk_TextBox').off('focusout').on('focusout' , update_resizeInk_TextBox);
  $('#resizeInk_TextBox').val(16); //墨字の初期値を指定

  $('#resetInk_Button').click(function(){  //リセットボタンを押下時の処理
    $("#resizeInk_Slider").slider("value",16);
    $("#resizeInk_TextBox").val(16);
    draw.select('.edit_select').each(function(i,children){
      if(this.hasClass('ink'))this.attr({'font-size': 16 * SVG_RATIO * 0.352778});
    })
  }); //墨字の初期値を指定
  $("#resizeInk_Slider").slider({
    max:30, //最大値
    min:4, //最小値
    value: 16, //初期値
    step: 1, //幅
    slide: function( event, ui ) {
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('ink'))this.attr({'font-size': ui.value * SVG_RATIO * 0.352778})
      })
      $('#resizeInk_TextBox').val(ui.value)
    }
  });

  /*****************************************
  //点字の大きさを設定するスライダー
  ******************************************/
  $('#resizeBraille_TextBox').off('focusout').on('focusout' , update_resizeBraille_TextBox);
  $('#resizeBraille_TextBox').val(18); //墨字の初期値を指定

  $('#brasize_resetbutton').click(function(){  //リセットボタンを押下時の処理
    $("#resizeBraille_Slider").slider("value",18);
    $("#resizeBraille_TextBox").val(18);
    draw.select('.edit_select').each(function(i,children){
      if(this.hasClass('braille'))this.attr({'font-size': 18 * SVG_RATIO * 0.352778});
    })
  }); //墨字の初期値を指定
  $("#resizeBraille_Slider").slider({
    max:30, //最大値
    min:4, //最小値
    value: 18, //初期値
    step: 1, //幅
    slide: function( event, ui ) {
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('braille'))this.attr({'font-size': ui.value * SVG_RATIO * 0.352778});
      })
      $('#resizeBraille_TextBox').val(ui.value);
    }
  });
  //墨字・点字のテキストボックスをフォーカスした時には文字入力モードへと自動的に変更する
  $('#InkChar').off('focusin').on('focusin' ,function() {
    $('input[name="tg_mode"][value="Text"]').prop('checked', true);
    RadioEvent_set();
  })
  $('#Braille').off('focusin').on('focusin' ,function() {
    $('input[name="tg_mode"][value="Text"]').prop('checked', true);
    RadioEvent_set();
  })

  /**************************************************************
  //画像透過度を変更するテキストボックス、リセットボタン、スライダーの設定
  **************************************************************/
  $('#ImageOpacity_TextBox').off('focusout').on('focusout' , update_ImageOpacity_TextBox);
  $('#ImageOpacity_TextBox').val(100);

  $('#ImageOpacity_resetbutton').click(function(){  //リセットボタンを押下時の処理
    $("#ImageOpacity_Slider").slider("value",100);
    $("#ImageOpacity_TextBox").val(100);
    draw.select('.edit_select').each(function(i,children){
      if(this.hasClass('image'))this.attr({'opacity': 1});
    })
  }); //墨字の初期値を指定
  $("#ImageOpacity_Slider").slider({
    max:100, //最大値
    min:1, //最小値
    value: 100, //初期値
    step: 1, //幅
    slide: function( event, ui ) {
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('image'))this.attr({'opacity': ui.value/100})
      })
      $('#ImageOpacity_TextBox').val(ui.value)
    }
  });
}

function leaveOnlyNumber(String_num){
  let converted = String_num.replace(/[０-９]/g, function(s) { // (1)
      return String.fromCharCode(s.charCodeAt(0) - 65248); // (2)
  });
  let array = converted.match(/[0-9]+\.?[0-9]*/g);
  return array[0]
}

function update_StrokeWidth_TextBox(){
  if(String($('#StrokeWidth_TextBox').val())!==""){
    let transNumber = leaveOnlyNumber($('#StrokeWidth_TextBox').val());
    $('#StrokeWidth_TextBox').val(transNumber)
    if(!transNumber.match(/[^0-9\.]/)){
      draw.select('.edit_select , .fragmented , .drawing_path').each(function(i,children){
        if(!this.hasClass('ink') && !this.hasClass('braille')){
          this.attr({'stroke-width': Number(transNumber) * PATH_STROKE_WIDTH });
          if(this.attr('stroke-dasharray')!==undefined && this.attr('stroke-dasharray')!=='')this.attr({'stroke-dasharray': PATH_STROKE_WIDTH});
        }
      })
    }
  }
}

function update_resizeInk_TextBox(){
  if(String($('#resizeInk_TextBox').val())!==""){
    let transNumber = leaveOnlyNumber($('#resizeInk_TextBox').val());
    $('#resizeInk_TextBox').val(transNumber)
    if(!transNumber.match(/[^0-9\.]/)){
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('ink')) this.attr({ 'font-size': Number(transNumber) * SVG_RATIO * 0.352778 });
      })
    }
  }
}

function update_resizeBraille_TextBox(){
  if(String($('#resizeBraille_TextBox').val())!==""){
    let transNumber = leaveOnlyNumber($('#resizeBraille_TextBox').val());
    $('#resizeInk_TextBox').val(transNumber)
    if(!transNumber.match(/[^0-9\.]/)){
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('braille')) this.attr({ 'font-size': Number(transNumber) * SVG_RATIO * 0.352778 });
      })
    }
  }
}

function update_ImageOpacity_TextBox(){
  if(String($('#ImageOpacity_TextBox').val())!==""){
    let transNumber = leaveOnlyNumber($('#ImageOpacity_TextBox').val());
    $('#ImageOpacity_TextBox').val(transNumber)
    if(!transNumber.match(/[^0-9\.]/)){
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('image')) this.attr({ 'opacity' : Number(transNumber)/100 });
      })
    }
  }
}
