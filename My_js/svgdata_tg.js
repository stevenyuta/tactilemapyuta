/******************************************************
//undo機能 操作した処理を戻す関数
******************************************************/
function undo() { //操作を１つ戻る関数
  if(cash_array.length > cash_pointer + 1){  //cash_arrayにデータがある場合
    var current_mode =  $('input[name="tg_mode"]:checked'); //現在のモードを記憶
    var vx = draw.viewbox().x , vy = draw.viewbox().y;
    var vwidth = draw.viewbox().width , vheight = draw.viewbox().height;

    $('#draw_area').remove(); //draw_areaの削除
    var draw_area = $('<div id="draw_area"></div>'); //新規作成
    $("#draw_include").append(draw_area);

    draw = SVG('draw_area').size(DRAW_AREA_WIDTH,DRAW_AREA_HEIGHT).attr('id','svg_draw_area');
    draw.viewbox(vx, vy, vwidth, vheight);
    draw.svg(cash_array[++cash_pointer]);

    draw_gridline(3000,3000,50,50); //グリッド線の描画
    defs_set();

    RadioEvent_set();
    checkBox_change();
    js_sleep(100); //100ms待機
  }
  undredo_checker();
}

/******************************************************
//redo機能 操作した処理を戻す関数
******************************************************/
function redo(e) { //操作を１つ戻る関数
  if(cash_pointer > 0){  //cash_arrayにデータがある場合
    var current_mode =  $('input[name="tg_mode"]:checked'); //現在のモードを記憶
    //現在のviewBox情報を取得
    var vx = draw.viewbox().x , vy = draw.viewbox().y;
    var vwidth = draw.viewbox().width , vheight = draw.viewbox().height;

    //draw_areaの削除と新規作成
    $('#draw_area').remove();
    var draw_area = $('<div id="draw_area"></div>');
    $("#draw_include").append(draw_area);

    draw = SVG('draw_area').size(DRAW_AREA_WIDTH,DRAW_AREA_HEIGHT).attr('id','svg_draw_area');
    draw.viewbox(vx, vy, vwidth, vheight);

    draw.svg(cash_array[--cash_pointer]);

    draw_gridline(3000,3000,50,50); //グリッド線の描画
    defs_set();

    RadioEvent_set();
    checkBox_change();
    js_sleep(100); //100ms待機
  }
  undredo_checker();
}


function cash_svg(){ //SVG文字列を配列に格納 undo時に随時読み込む
  var current_svg= "";
  //最初にcash_pointerまでcash_arrayを削除
  for(let i=0; i < cash_pointer; i++){
    cash_array.shift();
  }
  cash_pointer = 0; //cash_pointerは初期値の0にする
  SVG.get('svg_draw_area').each(function(i, children){
    //gridline_group以外のデータをすべて文字列として結合
    //gridline_groupは行数が多すぎ、データが肥大化するため、undo機能実行時に追加する
    if(this.attr('id') !== 'gridline_group') current_svg +=this.svg();
  })
  cash_array.unshift(current_svg); //配列として記憶する
  if(cash_array.length>CASH_MAX)cash_array.pop();  //CASH_MAX以上のデータは生成しない
  undredo_checker();
}

function undredo_checker(){
  if(cash_array.length > cash_pointer + 1){  //cash_arrayにデータがある場合
    $('#undo').css('cursor','pointer');
    $('#undo').css('background-color','#E2EDF9');
    $('#undo').css('border-color','orange');
    $('#undo').hover(function() {
      $(this).css('background', '#31A9EE');
    }, function() {
      $(this).css('background', '#E2EDF9');
    });
    $('#undo').prop("disabled", false);
  }else{
    $('#undo').css('cursor','default');
    $('#undo').css('background-color','#C0C0C0');
    $('#undo').css('color','#000000');
    $('#undo').css('border-color','#696969');
    $('#undo').off('mouseenter mouseleave');
    $('#undo').prop("disabled", true);
  }

  if(cash_pointer > 0){  //cash_arrayにデータがある場合
    $('#redo').css('cursor','pointer');
    $('#redo').css('background-color','#E2EDF9');
    $('#redo').css('border-color','orange');
    $('#redo').hover(function() {
      $(this).css('background', '#31A9EE');
    }, function() {
      $(this).css('background', '#E2EDF9');
    });
    $('#redo').prop("disabled", false);
  }else{
    $('#redo').css('cursor','default');
    $('#redo').css('background-color','#C0C0C0');
    $('#redo').css('color','#000000');
    $('#redo').css('border-color','#696969');
    $('#redo').off('mouseenter mouseleave');
    $('#redo').prop("disabled", true);
  }
}



/******************************************************
//ダウンロード時に出力svgファイルをフォーマットする関数
//返却値はsvg形式のテキストデータ
******************************************************/
function download_setSVG(original_draw) { //ダウンロード時に出力svgファイルをフォーマットする関数

  dummy_delete();
  edit_clear();
  toConnected();
  select_rect_delete(); //select_rectの全削除
  draw.select('.image_FrameRect').each(function(i,children){
    this.remove();
  })
  rect_delete();
  //不要なグループの削除
  SVG.get('gridline_group').remove();
  SVG.get('handle_group').remove();
  SVG.get('guiderect_group').remove();

  draw.select('.SVG_Element').each(function(){
    this.attr('cursor', null);
  })

  //グループ内に要素が何もないグループの削除
  var svg_str = original_draw.svg(); //serialとsvg_strはグローバル関数である
  svg_str = svg_str.replace( /\n/g , "" );
  svg_str = svg_str.replace( />/g , ">\n" );
  svg_str = svg_str.replace( /svgjs:data="{&quot;leading&quot;:&quot;1.3&quot;}"/g , "" )
  //現在の<svg>内のデータをcurrent_svgに記録
  var current_svg= ""
  draw.select('defs').each(function(){  //defs要素の全削除
    this.remove()
  })
  SVG.get('svg_draw_area').each(function(i, children){
    current_svg +=this.svg();
  })
  var viewbox = draw.viewbox();
  continue_setSVG(current_svg,viewbox.x,viewbox.y,viewbox.width,viewbox.height)

  return svg_str;
}


/******************************************************
//ダウンロード時に出力svgファイルをフォーマットする関数
//返却値はpng形式のテキストデータ
******************************************************/

function download_setPNG(original_draw) { //ダウンロード時に出力pngファイルをフォーマットする関数
  var viewbox = draw.viewbox();
  if(draw.select('.A4').first().style('display')!=='none'){
    var rotation = draw.select('.A4').first().transform('rotation')
    if(Math.abs(rotation) === 90){
      draw.viewbox(-367.5 , -519.75 , 735 , 1039.5 )
      draw.attr('width' , '2205').attr('height' , '3118.5')
    }else{
      draw.viewbox(-519.75 , -367.5 ,1039.5 , 735)
      draw.attr('width' , '3118.5').attr('height' , '2205')
    }
  }else{
    var rotation = draw.select('.B4').first().transform('rotation')
    if(Math.abs(rotation) === 90){
      draw.viewbox( -899/2, -1274/2 , 899 ,1274 )
      draw.attr('width' , '2697').attr('height' , '3822')
    }else{
      draw.viewbox(-1274/2, -899/2 ,1274 , 899)
      draw.attr('width' , '3822').attr('height' , '2697')
    }
  }
  draw.rect(1274, 1274).addClass('background_rect').back().move(-1274/2 , -1274/2).attr({'fill' : '#ffffff'})
  dummy_delete();
  edit_clear();
  toConnected();
  select_rect_delete(); //select_rectの全削除
  rect_delete(); //edit_circleの全削除
  //不要なグループの削除
  SVG.get('gridline_group').remove();
  SVG.get('handle_group').remove();

  //グループ内に要素が何もないグループの削除
  var png_str = original_draw.svg(); //serialとsvg_strはグローバル関数である
  png_str = png_str.replace( /\n/g , "" );
  png_str = png_str.replace( />/g , ">\n" );

  //現在の<svg>内のデータをcurrent_svgに記録
  var current_svg= ""
  draw.select('defs').each(function(){  //defs要素の全削除
    this.remove()
  })
  draw.select('.background_rect').each(function(){  //png化用の背景の全削除
    this.remove()
  })
  SVG.get('svg_draw_area').each(function(i, children){
    current_svg +=this.svg();
  })
  continue_setSVG(current_svg,viewbox.x,viewbox.y,viewbox.width,viewbox.height)

  return png_str;
}

function continue_setSVG(input_draw,vx,vy,vwidth,vheight){ //svgデータを読み込み再初期化する関数
  //html内の#draw_areaを削除して再配置
  $('#draw_area').remove();
  var draw_area = $('<div id="draw_area"></div>');
  $("#draw_include").append(draw_area);
  //drawの内容を再設定
  draw = SVG('draw_area').size(DRAW_AREA_WIDTH,DRAW_AREA_HEIGHT).attr('id','svg_draw_area');
  draw.viewbox(vx, vy, vwidth, vheight);
  draw.svg(input_draw);
  defs_set();
  set_zoom();
  set_handle(); //移動用ハンドル描画
  draw_gridline(3000,3000,50,50); //グリッド線の描画
  draw_guiderect(); //ガイドの描画
  checkBox_change();
  $('input[name="tg_mode"]:checked').prop('checked', true).trigger('change'); //モードを設定
}

/******************************************************
//file_apiの設定関数
******************************************************/
function set_fileAPI_continue(){
  //file_apiの処理
  var inputFile = $('#fileAPI_continue');
  var reader = new FileReader();

  function fileChange(ev) { //ファイル選択ボタンを押下時
    var file = ev.target.files[0];
    var type = file.type;

    if (type !== 'image/svg+xml') {
      alert('選択できるファイルはSVGファイルだけです。');
      inputFile.value = '';
      return;
    }
    reader.readAsText(file);
  }
  function fileLoad() {
    var svg_text = reader.result;
    svg_text = svg_text.replace(/<svg.+>/g, '')
    svg_text = svg_text.replace( /<\/svg>/g , "" );
    continue_setSVG(svg_text,-DRAW_AREA_WIDTH, -DRAW_AREA_HEIGHT, DRAW_AREA_WIDTH * 2, DRAW_AREA_HEIGHT * 2);
    cash_svg();
  }
  function fileClear() {
    this.value = null;
  }
  inputFile.on('click',fileClear);
  inputFile.on('change',fileChange);
  $(reader).on('load',fileLoad);
}


//ダウンロードリンク
function svgDownload() {
  var svg_str = download_setSVG(draw)
  var blob = new Blob([ svg_str ], { 'type' : 'text/plain' });
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveOrOpenBlob(blob, 'SVG_output.svg');
  } else {
    document.getElementById('svg_download').href = window.URL.createObjectURL(blob);
  }
}

function pngDownload() {
  var png_str = download_setPNG(draw)
  if(draw.select('.A4').first().style('display')!=='none'){
    var rotation = draw.select('.A4').first().transform('rotation')
    if(Math.abs(rotation) === 90){
      $("body").append("<canvas id='canvas1' visibility='hidden' width='2205' height='3118.5'></canvas>")
    }else{
      $("body").append("<canvas id='canvas1' visibility='hidden' width='3118.5' height='2205'></canvas>")
    }
  }else{
    var rotation = draw.select('.B4').first().transform('rotation')
    if(Math.abs(rotation) === 90){
      $("body").append("<canvas id='canvas1' visibility='hidden' width='2697' height='3822'></canvas>")
    }else{
      $("body").append("<canvas id='canvas1' visibility='hidden' width='3822' height='2697'></canvas>")
    }
  }
  var canvas = $("#canvas1")[0]
  var ctx = canvas.getContext("2d")
  var imgsrc = "data:image/svg+xml;charset=utf-8;base64,"+ btoa(unescape(encodeURIComponent(png_str)))
  var image = new Image()

  image.onload = function(){
    ctx.drawImage(image, 0, 0);
    var dataurl = canvas.toDataURL("image/png");
    var bin = atob(dataurl.split(',')[1]);
    // 空の Uint8Array ビューを作る
    var buffer = new Uint8Array(bin.length);
    // Uin t8Array ビューに 1 バイトずつ値を埋める
    for (var i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
    }
    // Uint8Array ビューのバッファーを抜き出し、それを元に Blob を作る
    var blob = new Blob([buffer.buffer], {type: "image/png"});
    var url = window.URL.createObjectURL(blob);
    ctx.drawImage(image, 0, 0);
    // Optional: 自動でダウンロードさせる場合
    $("body").append("<a id='image-file' class='hidden' type='application/octet-stream' href='"
                     + url + "' download='PNG_output.png'>Donload Image</a>");
    $("#image-file")[0].click();
    // 後処理
    $("#canvas1").remove();
    $("#image-file").remove();
    URL.revokeObjectURL(url); // オブジェクトURLを開放
  }
  image.src = imgsrc;
}

function legendDownload() {
  var legend_ink_array = new Array() , legend_braille_array = new Array();
  var legend_str = "";
  for(var i=0; i < text_pairs.length; i++){
    var text_pairs_id = text_pairs[i];
    var Braille = undefined , Ink = undefined;
    if(text_pairs_id.Braille) var Braille = SVG.get("#" + text_pairs_id.Braille);
    if(text_pairs_id.Ink) var Ink = SVG.get("#" + text_pairs_id.Ink);
    if(Braille){  //点字要素が入手できた場合
      legend_str += Braille.text() + " ： ";
    }
    if(Ink){
      legend_str += Ink.text();
      legend_ink_array.push(Ink.text());
    }
    if(Braille){
      /**
      if($('#graduation_frame').prop('checked')){
        for(let i=-F_WIDTH/2; i < F_WIDTH/2; i += F_WIDTH/4){
          if(i <= Braille.x() && Braille.x() < i + F_WIDTH/4) legend_str += ' 目盛り：横は' + String((i + F_WIDTH/2)/(F_WIDTH/4) + 1) + " ";
        }
        for(let i=-F_HEIGHT/2; i < F_HEIGHT/2; i += F_HEIGHT/3){
          if(i <= Braille.y() && Braille.y() < i + F_HEIGHT/3) legend_str += ' 縦は' + String((i + F_HEIGHT/2)/(F_HEIGHT/3) + 1) + " ";
        }
      }
      legend_str += '\r\n';
      **/
    }
  }
  var blob = new Blob([ legend_str ], { 'type' : 'text/plain' });
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveOrOpenBlob(blob, '凡例.txt');
  } else {
    document.getElementById('legend_download').href = window.URL.createObjectURL(blob);
  }
}
