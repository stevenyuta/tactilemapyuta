/******************************************************
/右クリックメニューの設定関数
******************************************************/
function set_contextMenu(flag){
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
          if(cash_array.length > cash_pointer + 1){
            return false;
          }else{
            return true;
          }
        }
      },
      "redo":{
        name: "やり直す",
        icon: "fa-repeat",
        disabled: function(){
          if(cash_pointer > 0){
            return false;
          }else{
            return true;
          }
        }
      },
      "copy":{
        name: "コピー",
        icon: "copy",
        disabled: function(){
          if(!draw.select('.edit_select').first()){
            return true;
          }else{
            return false;
          }
        }
      },
      "paste":{
        name: "貼り付け",
        icon: "paste" ,
        disabled: function(){
          if(copy_elements.length===0){
            return true;
          }else{
            return false;
          }
        }
      },
      "delete":{
        name: '削除',
        icon: 'fa-times',
        disabled: function(){
          if(!(draw.select('.edit_select').first() || draw.select('.editing_target').first())){
            return true;
          }else{
            return false;
          }
        }
      },
      "sep1": "---------",
      "draw_end":{
        name: '線の描画終了',
        icon: 'fa-pencil',
        disabled: function(){
          if(draw.select('.drawing_path').first()){
            return false;
          }else{
            return true;
          }
        }
      },
      "node_connect":{
        name: '端点のノードを結合',
        icon: 'fa-compress',
        disabled: function(){
          let connectCircle = get_node_connectCircle();
          if(connectCircle.circle1 && connectCircle.circle2){
            return false;
          }else{
            return true;
          }
        }
      },
      "verhor":{
        name: '線の垂直・水平化',
        icon: 'fa-wrench',
        disabled: function(){
          let editing_target_flag = true;
          draw.select('.editing_target').each(function(i,children){
            if(!this.hasClass('edit_circle')) editing_target_flag = false;
          })
          return editing_target_flag;
        }
      }
    }
  });
}


/******************************************************
/点字フォントラジオボタンの初期設定関数
******************************************************/
function braillefont_set(){
  $('input[name="braillefont"]:radio').off('change').on('change',function(){ //ラジオボタン変更時の処理
    let font_family = ($('input[name="braillefont"]:checked').val()==='IBfont') ? 'Ikarashi Braille' : '点字線なし';
    let font_strokewidth = ($('input[name="braillefont"]:checked').val()==='IBfont') ? String(PATH_STROKE_WIDTH * 0.25) : '';
    let font_strokecolor = ($('input[name="braillefont"]:checked').val()==='IBfont') ? '#000000' : 'none';
    draw.select('.braille').each(function(i,children){
      this.attr({
        'font-family': font_family,
        'stroke': font_strokecolor,
        'stroke-width': font_strokewidth
      });
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
     draw.select('.edit_select').each(function(i,children){
      if(!this.hasClass('ink') && !this.hasClass('braille')){
        this.attr({'stroke-dasharray': ''});
      }
    })
  }else{ //点線の場合
     draw.select('.edit_select').each(function(i,children){
      if(!this.hasClass('ink') && !this.hasClass('braille')){
        this.attr({'stroke-dasharray': PATH_STROKE_WIDTH * $('#StrokeWidth_TextBox').val()});
      }
    })
   }
  })
  $("#solid_line").prop('checked', true).change();//初期状態は実線にチェックを入れておく
}




/******************************************************
//グリッド線を描画する関数
******************************************************/
function draw_gridline(range_x,range_y,interval_x,interval_y){
  if(SVG.get('gridline_group')!==null)SVG.get('gridline_group').remove();
  var gridline_group =  draw.group().attr({ id: 'gridline_group' }).front(); //グリッド線のグループ
  for(var i=-range_x;i<=range_x;i+=interval_x){
    var line = draw.line(i, range_y, i, -range_y).attr({ 'stroke-width': 0.3 })
    gridline_group.add(line)
  }
  for(var i=-range_y;i<=range_y;i+=interval_y){
    var line = draw.line(range_x, i, -range_x, i).attr({ 'stroke-width': 0.3 })
    gridline_group.add(line)
  }
  if(!$('#gridline').prop('checked'))gridline_group.attr({'display':'none'});
}

/******************************************************
//A4、B4枠を描画する関数
******************************************************/

function draw_guiderect(){
  if(SVG.get('guiderect_group')===null){
    var guiderect_group = draw.group().attr({ id: 'guiderect_group' }).back();
    var guiderectA4 = draw.rect(GUIDE_WIDTH_A4 + 2 * GUIDE_STROKE_WIDTH , GUIDE_HEIGHT_A4 + 2 * GUIDE_STROKE_WIDTH);
    guiderectA4.addClass('guiderect').addClass('A4').front();
    guiderectA4.attr({
      'x' : -GUIDE_WIDTH_A4/2 - GUIDE_STROKE_WIDTH,
      'y' : -GUIDE_HEIGHT_A4/2 - GUIDE_STROKE_WIDTH,
      'fill':'none',
      'stroke': GUIDE_STROKE_COLOR_A4,
      'stroke-width': GUIDE_STROKE_WIDTH
    });
    guiderect_group.add(guiderectA4);

    var guiderectB4 = draw.rect(GUIDE_WIDTH_B4 + 2 * GUIDE_STROKE_WIDTH , GUIDE_HEIGHT_B4 + 2 * GUIDE_STROKE_WIDTH);
    guiderectB4.addClass('guiderect').addClass('B4').front();
    guiderectB4.attr({
      'x': -GUIDE_WIDTH_B4 / 2 - GUIDE_STROKE_WIDTH,
      'y': -GUIDE_HEIGHT_B4 / 2 - GUIDE_STROKE_WIDTH, //x,y座標の設定
      'fill':'none',
      'stroke': GUIDE_STROKE_COLOR_B4,
      'stroke-width': GUIDE_STROKE_WIDTH
    });
    guiderect_group.add(guiderectB4);
  }
  if($( 'input[name="guiderect"]:checked' ).val() === 'guiderect_A4'){
      draw.select('.A4').show()
      draw.select('.B4').hide()
  }else{
      draw.select('.A4').show()
      draw.select('.B4').hide()
  }
  if($( 'input[name="direction_guide"]:checked' ).val() === 'horizontal_guide'){
    draw.select('.A4').transform({rotation:0})
    draw.select('.B4').transform({rotation:0})
  }else{
    draw.select('.A4').transform({rotation:90})
    draw.select('.B4').transform({rotation:90})
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
  $('#draw_svg').off('change').change( function() {
    if($('#draw_svg').prop('checked')){
      draw.select('.SVG_Element').each(function(i , children){
        if(!this.hasClass('scale') && !this.hasClass('graduationFrame')) this.show();
      })
    }else{
      draw.select('.SVG_Element').each(function(i , children){
        if(!this.hasClass('scale') && !this.hasClass('graduationFrame')) this.hide();
      })
    }
  })
  $("#draw_svg").prop('checked', true).change();//初期状態はチェックを入れておく
  /**************************************************
  //原図の表示非表示機能をチェックボックスと連結
  ***************************************************/
  $('#image').off('change').change( function() {
    if($('#image').prop('checked')){
      SVG.select('.image').show();
    }else{
      SVG.select('.image').hide();
    }
  })
  $("#image").prop('checked', true).change();//初期状態はチェックを入れておく
  /**************************************************
  //グリッド線の表示非表示機能をチェックボックスと連結
  ***************************************************/
  $('#gridline').off('change').change( function() {
    if($('#gridline').prop('checked')){
      SVG.get('gridline_group').attr({'display':'inline'})
    }else{
      SVG.get('gridline_group').attr({'display':'none'})
    }
  })
  $("#gridline").prop('checked', false).change();//初期状態はチェックを入れておく
  /**************************************************
  //点字の日本語変換機能をチェックボックスと連結
  ***************************************************/
  $('#2Braille').off('change').change( function() {
    let font_family = ($('input[name="braillefont"]:checked').val()==='IBfont') ? 'Ikarashi Braille' : '点字線なし';
    if($('#2Braille').prop('checked')){
      draw.select('.braille').attr({'font-family':'メイリオ'});
    }else{
      draw.select('.braille').attr({'font-family':font_family});
    }
  })
  $("#2Braille").prop('checked', false).change();//初期状態はチェックを入れないでおく


  /**************************************************
  //目盛り枠の表示、非表示
  ***************************************************/
  $('#graduation_frame').off('change').change( function() {
    if(!draw.select('.graduationFrame').first()) add_graduationFrame();
    if($('#graduation_frame').prop('checked')){
      draw.select('.graduationFrame').show();
    }else{
      draw.select('.graduationFrame').hide();
    }
  })
  $("#graduation_frame").prop('checked', false).change();//初期状態はチェックを入れないでおく

  /**************************************************
  //ガイドの表示非表示チェックボックス
  ***************************************************/
  $( 'input[name="guiderect"]:radio' ).change( function() {
    var radioval = $(this).val()
    if(radioval === 'guiderect_A4'){
      draw.select('.A4').show()
      draw.select('.B4').hide()
    }else{
      draw.select('.B4').show()
      draw.select('.A4').hide()
    }
  })

  $('input[name=guiderect]').val(['guiderect_A4'])
  draw.select('.A4').show()
  draw.select('.B4').hide()

  $( 'input[name="direction_guide"]:radio' ).change( function() {
    var radioval = $(this).val()
    if(radioval === 'horizontal_guide'){
      draw.select('.A4').transform({rotation:0})
      draw.select('.B4').transform({rotation:0})
    }else{
      draw.select('.A4').transform({rotation:90})
      draw.select('.B4').transform({rotation:90})
    }
  })
  $('input[name=direction_guide]').val(['horizontal_guide'])
  draw.select('.A4').transform({rotation:0})
  draw.select('.B4').transform({rotation:0})

}

function checkBox_change(){
  //SVG要素
  if($('#draw_svg').prop('checked')){
    draw.select('.SVG_Element').each(function(i , children){
      if(!this.hasClass('scale') && !this.hasClass('graduationFrame')) this.show();
    })
  }else{
    draw.select('.SVG_Element').each(function(i , children){
      if(!this.hasClass('scale') && !this.hasClass('graduationFrame')) this.hide();
    })
  }
  //原図
  if($('#image').prop('checked')){
    SVG.select('.image').attr({'display':'inline'})
  }else{
    SVG.select('.image').attr({'display':'none'})
  }
  //グリッド線
  if($('#gridline').prop('checked')){
    SVG.get('gridline_group').attr({'display':'inline'})
  }else{
    SVG.get('gridline_group').attr({'display':'none'})
  }
  //点訳
  let font_family = ($('input[name="braillefont"]:checked').val()==='IBfont') ? 'Ikarashi Braille' : '点字線なし';
  if($('#2Braille').prop('checked')){
    draw.select('.braille').each(function(i,children){
      this.attr({'font-family':'メイリオ'})
    })
  }else{
    draw.select('.braille').each(function(i,children){
      this.attr({'font-family':font_family})
    })
  }

  //ガイドの四角形がA4かB4か
  var radioval = $( 'input[name="guiderect"]:checked' ).val();
  if(radioval === 'guiderect_A4'){
    draw.select('.A4').show()
    draw.select('.B4').hide()
  }else{
    draw.select('.B4').show()
    draw.select('.A4').hide()
  }

  //ガイドの四角形が横か縦か
  var radioval = $( 'input[name="direction_guide"]:checked' ).val()
  if(radioval === 'horizontal_guide'){
    draw.select('.A4').transform({rotation:0})
    draw.select('.B4').transform({rotation:0})
  }else{
    draw.select('.A4').transform({rotation:90})
    draw.select('.B4').transform({rotation:90})
  }
}

/******************************************************
//描画領域上のズーム機能
******************************************************/
function set_zoom(){
  draw.panZoom({ //zoomの導入
    doPanning: false,
    zoomFactor: 0.07,
    zoomMin: 0.1,
    zoomMax: 4
  })
  draw.off('zoom').on('zoom', function(ev) {
    viewbox_x = draw.viewbox().x , viewbox_y = draw.viewbox().y
    $("#width_slider").slider({ //描画領域の左右移動用スライダー
        max: 8000-draw.viewbox().x-draw.viewbox().width,
        min: -8000-draw.viewbox().x,
        value: 0, //初期値
    });
    $("#height_slider").slider({ //描画領域の上下移動用スライダー
        max: 8000+draw.viewbox().y,
        min: -8000+draw.viewbox().y+draw.viewbox().height,
        value: 0, //初期値
    })
    var gY = 0;
    SVG.get('handle_group').each(function(i , children){
      if(this.type === 'rect') gY = this.attr('y');
      if(this.type === 'circle') this.radius(HANDLE_CIRCLE_RADIUS/(2*draw.viewbox().zoom));
      if(this.attr('id') === 'rot_resize') this.attr({'cy' : gY - 15/draw.viewbox().zoom});
    })

    draw.select('.svg_select_points').attr({'r':HANDLE_CIRCLE_RADIUS/(2*draw.viewbox().zoom)});
    draw.select('.svg_select_points_rot').attr({ 'r':HANDLE_CIRCLE_RADIUS/(2*draw.viewbox().zoom) });

    SVG.select('.edit_circle , .draw_close_circle').each(function(i , children){
      this.radius(CIRCLE_RADIUS/(2*draw.viewbox().zoom))
    })
    SVG.select('.draw_init_rect , .draw_last_rect').each(function(i , children){
      let origi_cx = this.x() + this.width()/2;
      let origi_cy = this.y() + this.height()/2;
      this.width(RECT_WIDTH/(2*draw.viewbox().zoom));
      this.height(RECT_HEIGHT/(2*draw.viewbox().zoom));
      this.x(origi_cx - this.width()/2);
      this.y(origi_cy - this.height()/2);
    })
  })
}


//////////////////////////////////////////////////////////
//スクロールスライダー、墨字点字、線幅変更用ガジェットの初期設定
//////////////////////////////////////////////////////////
function gadget_set(e){
  /*****************************************
  描画領域の上下左右スクロールスライダー
  ******************************************/
  $("#width_slider").slider({
    max:8000, //最大値
    min:-8000, //最小値
    value: 0, //初期値
    step: 1, //幅
    slide: function( event, ui ) {
      var viewbox = draw.viewbox();
      draw.viewbox(viewbox_x+ui.value,viewbox.y,viewbox.width,viewbox.height);
    }
  });
  $("#height_slider").slider({
    orientation: 'vertical',
    max:8000, //最大値
    min:-8000, //最小値
    value: 0, //初期値
    step: 1, //幅
    slide: function( event, ui ) {
      var viewbox = draw.viewbox();
      draw.viewbox(viewbox.x,viewbox_y-ui.value,viewbox.width,viewbox.height);
    }
  });

  /************************************************************
  線幅を変更するテキストボックス、リセットボタン、スライダーの設定
  *************************************************************/
  $('#StrokeWidth_TextBox').off('keyup').on('keyup' ,function() {
    if(!this.value.match(/[^0-9\.]/) && this.value!==0 && String(this.value)!=="\." && String(this.value)!==""){
      let self_value = this.value;
      draw.select('.edit_select').each(function(i,children){
        if(!this.hasClass('ink') && !this.hasClass('braille')){
          this.attr({'stroke-width': Number(self_value) * PATH_STROKE_WIDTH });
          if(this.attr('stroke-dasharray')!==undefined && this.attr('stroke-dasharray')!=='')this.attr({'stroke-dasharray': PATH_STROKE_WIDTH});
        }
      })
    }
  })
  $('#StrokeWidth_TextBox').val(1); //線幅の初期値を指定

  $('#resetStrokeWidth_Button').click(function(){  //線幅リセットボタンを押下時の処理
    $("#StrokeWidth_Slider").slider("value" , 1);
    $("#StrokeWidth_TextBox").val(1);
    draw.select('.edit_select').each(function(i,children){
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
      draw.select('.edit_select').each(function(i,children){
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
  $('#resizeInk_TextBox').val(16); //墨字の初期値を指定

  $('#resizeInk_TextBox').off('keyup').on('keyup' ,function() {
    if(!this.value.match(/[^0-9\.]/) && this.value!==0 && String(this.value)!=="\." && String(this.value)!==""){
      let self_value = this.value;
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('ink')) this.attr({ 'font-size': Number(self_value) * SVG_RATIO * 0.352778 });
      })
    }
  })

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
  $('#resizeBraille_TextBox').val(18); //墨字の初期値を指定

  $('#resizeBraille_TextBox').off('keyup').on('keyup' ,function() {
    if(!this.value.match(/[^0-9\.]/) && this.value!==0 && String(this.value)!=="\." && String(this.value)!==""){
      let self_value = this.value;
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('braille'))this.attr({'font-size': Number(self_value) * SVG_RATIO * 0.352778});
      })
    }
  })

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
    $('input[name="tg_mode"][value="Text"]').prop('checked', true).trigger('change');
  })
  $('#Braille').off('focusin').on('focusin' ,function() {
    $('input[name="tg_mode"][value="Text"]').prop('checked', true).trigger('change');
  })

  /**************************************************************
  //画像透過度を変更するテキストボックス、リセットボタン、スライダーの設定
  **************************************************************/
  $('#ImageOpacity_TextBox').val(100); //墨字の初期値を指定

  $('#ImageOpacity_TextBox').off('keyup').on('keyup' ,function() {
    if(!this.value.match(/[^0-9\.]/) && this.value!==0 && String(this.value)!=="\." && String(this.value)!==""){
      let self_value = this.value;
      draw.select('.edit_select').each(function(i,children){
        if(this.hasClass('image')) this.attr({ 'opacity': self_value/100 });
      })
    }
  })

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
