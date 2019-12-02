function cash_svg(){ //SVG文字列を配列に格納 undo時に随時読み込む
  let current_svg= "";
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
    $('#button_undo').css({
      'cursor' :'pointer',
      'background-color' : '#E2EDF9',
      'border-color' : 'orange'
    });
    $('#button_undo').hover(function() {
      $(this).css('background', '#31A9EE');
    }, function() {
      $(this).css('background', '#E2EDF9');
    });
    $('#button_undo').prop("disabled", false);
  }else{
    $('#button_undo').css({
      'cursor' : 'default',
      'background-color' : '#C0C0C0',
      'color' : '#000000',
      'border-color' : '#696969'
    });
    $('#button_undo').off('mouseenter mouseleave');
    $('#button_undo').prop("disabled", true);
  }

  if(cash_pointer > 0){  //cash_arrayにデータがある場合
    $('#button_redo').css({
      'cursor' : 'pointer',
      'background-color' : '#E2EDF9',
      'border-color' : 'orange',
    });
    $('#button_redo').hover(function() {
      $(this).css('background', '#31A9EE');
    }, function() {
      $(this).css('background', '#E2EDF9');
    });
    $('#button_redo').prop("disabled", false);
  }else{
    $('#button_redo').css({
      'cursor':'default',
      'background-color' : '#C0C0C0',
      'color' : '#000000',
      'border-color' : '#696969'
    });
    $('#button_redo').off('mouseenter mouseleave');
    $('#button_redo').prop("disabled", true);
  }
}

/******************************************************
//ダウンロード時に出力svgファイルをフォーマットする関数
//返却値はsvg形式のテキストデータ
******************************************************/
function download_setSVG(original_draw) { //ダウンロード時に出力svgファイルをフォーマットする関数
  selector_delete('.dummy');
  edit_clear();
  toConnected();
  selector_delete('.select_rect');
  selector_delete('.edit_rect , .init_node , .last_node , .close_node');
  selector_delete('.Nodes_Group');
  //不要なグループの削除
  SVG.get('gridline_group').remove();
  SVG.get('handle_group').remove();
  SVG.get('guiderect_group').remove();

  draw.select('.SVG_Element').attr('cursor', null);

  //グループ内に要素が何もないグループの削除
  let svg_str = original_draw.svg(); //serialとsvg_strはグローバル関数である
  svg_str = svg_str.replace( /\n/g , "" );
  svg_str = svg_str.replace( />/g , ">\n" );
  svg_str = svg_str.replace( /svgjs:data="{&quot;leading&quot;:&quot;1.3&quot;}"/g , "" )
  //現在の<svg>内のデータをcurrent_svgに記録
  let current_svg= "";
  selector_delete('defs');
  SVG.get('svg_draw_area').each(function(i, children){
    current_svg +=this.svg();
  })
  let viewbox = draw.viewbox();
  continue_setSVG(current_svg,viewbox.x,viewbox.y,viewbox.width,viewbox.height)

  return svg_str;
}


/******************************************************
//ダウンロード時に出力svgファイルをフォーマットする関数
//返却値はpng形式のテキストデータ
******************************************************/

function download_setPNG(original_draw) { //ダウンロード時に出力pngファイルをフォーマットする関数
  let viewbox = draw.viewbox();
  if(draw.select('.A4').first().style('display')!=='none'){
    let rotation = draw.select('.A4').first().transform('rotation')
    if(Math.abs(rotation) === 90){
      draw.viewbox(-367.5 , -519.75 , 735 , 1039.5 );
      draw.attr('width' , '2205').attr('height' , '3118.5');
    }else{
      draw.viewbox(-519.75 , -367.5 ,1039.5 , 735);
      draw.attr('width' , '3118.5').attr('height' , '2205');
    }
  }else if(draw.select('.B4').first().style('display')!=='none'){
    let rotation = draw.select('.B4').first().transform('rotation');
    if(Math.abs(rotation) === 90){
      draw.viewbox( -899/2, -1274/2 , 899 ,1274 );
      draw.attr('width' , '2697').attr('height' , '3822');
    }else{
      draw.viewbox(-1274/2, -899/2 ,1274 , 899);
      draw.attr('width' , '3822').attr('height' , '2697');
    }
  }else{
    let rotation = draw.select('.A3').first().transform('rotation');
    if(Math.abs(rotation) === 90){
      draw.viewbox( -1039.5/2, -1470/2 , 1039.5 , 1470);
      draw.attr('width' , '3118.5').attr('height' , '4410');
    }else{
      draw.viewbox(-1470/2, -1039.5/2 ,1470 , 1039.5);
      draw.attr('width' , '4410').attr('height' , '3118.5');
    }
  }
  draw.rect(1274, 1274).addClass('background_rect').back().move(-1274/2 , -1274/2).attr({'fill' : '#ffffff'});
  selector_delete('.dummy');
  edit_clear();
  toConnected();
  selector_delete('.select_rect');
  selector_delete('.edit_rect , .init_node , .last_node , .close_node');
  selector_delete('.Nodes_Group');
  add_fontStyle();
  //不要なグループの削除
  SVG.get('gridline_group').remove();
  SVG.get('handle_group').remove();

  //グループ内に要素が何もないグループの削除
  let png_str = original_draw.svg(); //serialとsvg_strはグローバル関数である
  png_str = png_str.replace( /\n/g , "" );
  png_str = png_str.replace( />/g , ">\n" );

  //現在の<svg>内のデータをcurrent_svgに記録
  let current_svg= "";
  selector_delete('defs');
  selector_delete('.background_rect');
  SVG.get('svg_draw_area').each(function(i, children){
    current_svg +=this.svg();
  })
  continue_setSVG(current_svg,viewbox.x,viewbox.y,viewbox.width,viewbox.height);

  return png_str;
}

function continue_setSVG(input_draw,vx,vy,vwidth,vheight){ //svgデータを読み込み再初期化する関数
  //html内の#draw_areaを削除して再配置
  $('#draw_area').remove();
  $("#draw_include").append($('<div id="draw_area"></div>'));
  //drawの内容を再設定
  draw = SVG('draw_area').size(DRAW_AREA_WIDTH,DRAW_AREA_HEIGHT).attr('id','svg_draw_area');
  draw.viewbox(vx, vy, vwidth, vheight);
  draw.svg(input_draw);
  defs_set();
  set_zoom();
  set_handle(); //選択モードで使うハンドルの描画
  draw_gridline(3000,3000,75,75); //グリッド線の描画
  draw_guiderect(); //ガイドの描画
  checkBox_change();
  $('input[name="tg_mode"]:checked').prop('checked', true).trigger('change'); //モードを設定
  RadioEvent_set();
}

//ダウンロードリンク
function svgDownload() {
  let svg_str = download_setSVG(draw);
  let blob = new Blob([ svg_str ], { 'type' : 'text/plain' });
  //現在の年月日、時刻データを取得し、ファイ名にする
  let current_data = new Date();
  let year = current_data.getFullYear();
  let month = current_data.getMonth()+1;
  if(month < 10) month = '0' + month;
  let day = current_data.getDate();
  if(day < 10) day = '0' + day;
  let hour = current_data.getHours();
  if(hour < 10) hour = '0' + hour;
  let minute = current_data.getMinutes();
  if(minute < 10) minute = '0' + minute;
  let second = current_data.getSeconds();
  if(second < 10) second = '0' + second;

  let file_name = year +'_'+ month + day + '_' +hour + minute + second +'.svg';
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveOrOpenBlob(blob, file_name);
  } else {
    document.getElementById('svg_download').download = file_name;
    document.getElementById('svg_download').href = window.URL.createObjectURL(blob);
  }
}

function pngDownload() {
  var png_str = download_setPNG(draw)
  if(draw.select('.A4').first().style('display')!=='none'){
    let rotation = draw.select('.A4').first().transform('rotation');
    if(Math.abs(rotation) === 90){
      $("body").append("<canvas id='canvas1' visibility='hidden' width='2205' height='3118.5'></canvas>");
    }else{
      $("body").append("<canvas id='canvas1' visibility='hidden' width='3118.5' height='2205'></canvas>");
    }
  }else if(draw.select('.B4').first().style('display')!=='none'){
    let rotation = draw.select('.B4').first().transform('rotation');
    if(Math.abs(rotation) === 90){
      $("body").append("<canvas id='canvas1' visibility='hidden' width='2697' height='3822'></canvas>");
    }else{
      $("body").append("<canvas id='canvas1' visibility='hidden' width='3822' height='2697'></canvas>");
    }
  }else{
    let rotation = draw.select('.A3').first().transform('rotation');
    if(Math.abs(rotation) === 90){
      $("body").append("<canvas id='canvas1' visibility='hidden' width='3118.5' height='4410'></canvas>");
    }else{
      $("body").append("<canvas id='canvas1' visibility='hidden' width='4410' height='3118.5'></canvas>");
    }
  }
  let canvas = $("#canvas1")[0];
  let ctx = canvas.getContext("2d");
  let imgsrc = "data:image/svg+xml;charset=utf-8;base64,"+ btoa(unescape(encodeURIComponent(png_str)));
  let image = new Image();

  image.onload = function(){
    ctx.drawImage(image, 0, 0);
    let dataurl = canvas.toDataURL("image/png");
    let bin = atob(dataurl.split(',')[1]);
    // 空の Uint8Array ビューを作る
    let buffer = new Uint8Array(bin.length);
    // Uin t8Array ビューに 1 バイトずつ値を埋める
    for (let i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
    }
    // Uint8Array ビューのバッファーを抜き出し、それを元に Blob を作る
    let blob = new Blob([buffer.buffer], {type: "image/png"});
    let url = window.URL.createObjectURL(blob);
    ctx.drawImage(image, 0, 0);

    //現在の年月日、時刻データを取得し、ファイ名にする
    let current_data = new Date();
    let year = current_data.getFullYear();
    let month = current_data.getMonth()+1;
    if(month < 10) month = '0' + month;
    let day = current_data.getDate();
    if(day < 10) day = '0' + day;
    let hour = current_data.getHours();
    if(hour < 10) hour = '0' + hour;
    let minute = current_data.getMinutes();
    if(minute < 10) minute = '0' + minute;
    let second = current_data.getSeconds();
    if(second < 10) second = '0' + second;

    let file_name = year +'_'+ month + day + '_' +hour + minute + second +'.png';
    // Optional: 自動でダウンロードさせる場合
    // Optional: 自動でダウンロードさせる場合
    $("body").append("<a id='image-file' class='hidden' type='application/octet-stream' href='"
                     + url + "' download='" + file_name + "'>Donload Image</a>");
    $("#image-file")[0].click();
    // 後処理
    $("#canvas1").remove();
    $("#image-file").remove();
    URL.revokeObjectURL(url); // オブジェクトURLを開放
  }
  image.src = imgsrc;
}
