/********************************************
このjsファイルではアプリ起動時の初期設定を行う。
基本的には1度しか実行されない
********************************************/

/******************
1.定数の定義
*******************/

//svgデータのwidthとheightの定義
const DRAW_AREA_WIDTH = 1039.5;
const DRAW_AREA_HEIGHT = 735;

//A4サイズ(297mm × 210mm)に対するsvgデータのサイズの比率
//この値がSVGデータでの座標系における1mmに相当する
const SVG_RATIO = DRAW_AREA_WIDTH / 297;

//pathの属性について
const PS_COLOR = '#000'; //通常時（黒色）
const PATH_EDIT_COLOR = '#0000CD'; //詳細編集での選択時（青色）
const PS_WIDTH = SVG_RATIO; //線幅（1mm）

const THRE_DISTANCE = 3 * SVG_RATIO; //距離チェック時の閾値 3mm

//textの基本設定
const INK_FILL_COLOR = '#0066ff';//デフォルトの墨字の色
const BRA_FILL_COLOR = '#000';//デフォルトの点字の色
const DEF_INK_SIZE = '16'; //デフォルトの墨字サイズ
const DEF_BRA_SIZE = '18'; //デフォルトの点字サイズ
const TEXT_CORRECTION = SVG_RATIO * 0.352778;

//戻す、やり直しができる最大回数
const CASH_MAX = 40;

//PNGダウンロード時の用紙サイズを示す枠
const GUIDE_WIDTH_A4 = DRAW_AREA_WIDTH; //A4
const GUIDE_HEIGHT_A4 = DRAW_AREA_HEIGHT; //A4
const GUIDE_STROKE_COLOR_A4 = '#f0f'; //線の色(A4)
const GUIDE_WIDTH_B4 = DRAW_AREA_WIDTH * 364/297; //B4
const GUIDE_HEIGHT_B4 = DRAW_AREA_HEIGHT * 257/210; //B4
const GUIDE_STROKE_COLOR_B4 = '#006400'; //線の色(B4)
const GUIDE_WIDTH_A3 = DRAW_AREA_WIDTH * 420/297; //A3
const GUIDE_HEIGHT_A3 = DRAW_AREA_HEIGHT * 297/210; //A3
const GUIDE_STROKE_COLOR_A3 = '#AA6400'; //線の色(A3)
const GUIDE_STROKE_WIDTH = 2; //太さ（正直適当）

//選択モード時の選択ボックスのハンドル（円）の半径の初期値
const SELECT_HANDLE_RADIUS = 10;
//選択モード時の範囲選択の範囲を示す四角形
const SELECT_RECT_COLOR = '#f00'; //赤色
const SELECT_RECT_STROKEWIDTH = 2; //太さ（正直適当）
const SELECT_RECT_STROKEDOTT = String(SVG_RATIO) + ' ' + String(SVG_RATIO); //点線の指定（詳しくはSVGの仕組みを調べよう）
//選択モード時などにカーソルキーを押して移動させるときの移動量
const CURSOR_KEY_MOVE = 0.3

//階段、エスカレータ記号用定数（一応、値を変えると形が変わる）
const STAIRS_BX = 15;
const STAIRS_BY = STAIRS_BX - 2;

//線の詳細編集などに使用するノード（四角形）について
const EDIT_RECT_COLOR = '#32CD32';
const EDIT_HOVER_COLOR = '#00f'; //選択ホバー時(青色)

//線の描画モード関係
const DRAW_NODE_COLOR = '#32CD32'; //ノードの色
const DRAW_HOVER_COLOR = '#B22222'; //ホバー時（赤っぽい色）

//線の描画モードと線の詳細編集モードでのノード（正方形）の長さの初期値
const RECT_WIDTH = 13;
const RECT_HEIGHT = 13;

//目盛付き枠用
const F_WIDTH = SVG_RATIO * 297 * 297/364 ,  F_HEIGHT = SVG_RATIO * 210 * 297/364 ;
const F_SCALE = SVG_RATIO * 5; //5mm

/***********************
2.グローバル変数の定義
************************/

let nowchecked; //現在選択しているモードを格納
let mx = 0 , my = 0;

let cash_array = new Array()　, cash_pointer = 0; //undo、redo機能用
let input_key_buffer = new Array(); //キー入力状態を保有  キーコードの数字に対応する配列が　⇒　押してる時：true ,  押していない時： false
let arrIntervalCnt = new Array(); //タイマー処理のリセットに使う
let viewbox_x = -DRAW_AREA_WIDTH , viewbox_y = -DRAW_AREA_HEIGHT; //現在のviewboxのx,yの値

let now_drawing_path_ID; //現在、描画している線のIDを格納
let drawing_path_dpoint=""; //現在、描画している線のd属性を保持する

let now_movingFlag = false; //現在、選択して、移動させたり、拡大縮小させたり、回転させたりしている時にtrue
let copy =  new Array(); //コピー機能で現在コピーの対象になっている要素を格納する

//以下は描画領域のスクロールバーに関する変数
let widthScrollBar_ratio , widthScrollBar_center;
let heightScrollBar_ratio , heightScrollBar_center;

/*************************************************
3.window（HTMLファイル）が読み込まれてから行う処理
*************************************************/
$(window).on('load',function () {
  //3.1 ウィンドウサイズ変更と、それが自動変更されるように設定
  resize_application_area();
  window.onresize = function (){ resize_application_area(); } //ウィンドウサイズが変更した場合に実行

  //3.2 描画領域の初期設定
  continue_setSVG('',-DRAW_AREA_WIDTH, -DRAW_AREA_HEIGHT, DRAW_AREA_WIDTH * 2, DRAW_AREA_HEIGHT * 2);

  //3.3 描画領域の表示範囲を調整する左右スクロールスライダー(SVGで描画)の設定
  let width_scrollbar = SVG('scrollbar_width').size(1040,10).attr('id','width_scrollbar');
  width_scrollbar.rect(1040, 10).stroke('#000000').fill('#ffffff'); //スライダーの大枠を描画
  let width_handle = width_scrollbar.rect(100, 10).attr({ //操作ハンドル（水色の四角形）を描画
    'x' : 470, // ( 1040 - 100 )/2 = 470
    'id' : 'width_handle',
    'fill' : '#3399ff',
    'cursor' : 'pointer'
  })
  width_handle.draggable({minX: 0, minY: 0, maxX: 1040, maxY: 10}); //指定した範囲でドラッグ可能にする svg.draggable.jsを利用
  widthScrollBar_ratio = (4000 - draw.viewbox().width)/940;
  widthScrollBar_center = widthScrollBar_ratio*470;
  width_handle.on('dragmove.namespace', function(event){ //ドラッグして、移動している間、動き続ける処理
    let viewbox = draw.viewbox();
    let new_viewbox_x = widthScrollBar_ratio*Number(this.attr('x')) - widthScrollBar_center + viewbox_x;
    draw.viewbox(new_viewbox_x, viewbox.y, viewbox.width, viewbox.height);
  })

  //3.4 描画領域の表示範囲を指定する上下スクロールスライダー(SVGで描画)の設定
  //基本的にやることは左右するクロールバーと同じ（コメント省略）
  let height_scrollbar = SVG('scrollbar_height').size(10,735).attr('id','height_scrollbar');
  height_scrollbar.rect(10,735).stroke('#000000').fill('#ffffff');
  let height_handle = height_scrollbar.rect(10, 100).attr({
    'y' : 317.5,
    'id' : 'height_handle',
    'fill' : '#3399ff',
    'cursor' : 'pointer'
  })
  height_handle.draggable({ minX: 0, minY: 0,  maxX: 10, maxY: 735 });
  heightScrollBar_ratio = (4000 - draw.viewbox().height)/635;
  heightScrollBar_center = heightScrollBar_ratio*317.5;

  height_handle.on('dragmove.namespace', function(event){
    let viewbox = draw.viewbox();
    let new_viewbox_y = heightScrollBar_ratio*Number(this.attr('y')) - heightScrollBar_center + viewbox_y;
    draw.viewbox(viewbox.x, new_viewbox_y, viewbox.width, viewbox.height);
  })


  //3.5 線幅を変更するテキストボックス、リセットボタンの設定
  $('#textbox_strokewidth').off('focusout').on('focusout' , update_textbox_strokewidth); //テキストボックスからfocusoutしたとき
  $('#textbox_strokewidth').val(1); //線幅の初期値を指定

  $('#button_reset_strokewidth').click(function(){  //線幅のリセットボタンを押したときの処理
    $("#textbox_strokewidth").val(1);
    let drawing_path_selector = (now_drawing_path_ID === '' || now_drawing_path_ID === undefined) ? '' : ',#' + now_drawing_path_ID;
    draw.select('.edit_select.path , .edit_select.circle , .fragmented' + drawing_path_selector).each(function(i,children){
      this.attr({ 'stroke-width':PS_WIDTH });
      if(this.attr('stroke-dasharray')!== undefined && this.attr('stroke-dasharray')!=='') this.attr({'stroke-dasharray':PS_WIDTH}); //点線の場合
    })
  });


  //3.6 墨字サイズを変更するテキストボックス、リセットボタンの設定
  $('#textbox_resize_ink').off('focusout').on('focusout' , update_resizeInk_TextBox);
  $('#textbox_resize_ink').val(DEF_INK_SIZE); //墨字の初期値を指定

  $('#button_reset_ink').click(function(){  //リセットボタンを押下時の処理
    $("#textbox_resize_ink").val(DEF_INK_SIZE);
    draw.select('.edit_select.ink').attr({'font-size': DEF_INK_SIZE * SVG_RATIO * 0.352778}); //0.352778をかけることでpt値になる
  });

  //3.7 点字の大きさを設定するテキストボックス、リセットボタンの設定
  $('#textbox_resize_braille').off('focusout').on('focusout' , update_resizeBraille_TextBox);
  $('#textbox_resize_braille').val(DEF_BRA_SIZE); //点字の初期値を指定

  $('#button_reset_braille').click(function(){  //リセットボタンを押下時の処理
    $("#textbox_resize_braille").val(DEF_BRA_SIZE);
    draw.select('.edit_select.braille').attr({'font-size': DEF_BRA_SIZE * SVG_RATIO * 0.352778});
  });

  //画像透過度を変更するテキストボックス、リセットボタンの設定
  $('#textbox_image_opacity').off('focusout').on('focusout' , update_textbox_image_opacity);
  $('#textbox_image_opacity').val(100);

  $('#button_reset_image_opacity').click(function(){  //リセットボタンを押下時の処理
    $("#textbox_image_opacity").val(100);
    draw.select('.edit_select.image').attr({'opacity': 1});
  });


  //画面左下のチェックボックスの初期設定を行う
  $("#check_ink").prop('checked', true).change();//初期ではスタンプ機能の文字の墨字はチェックを入れておく
  $("#check_bra").prop('checked', true).change();//初期ではスタンプ機能の文字の点字はチェックを入れておく

  //SVG要素の表示非表示チェックボックス
  $('#display_DrawElement').off('change').change( function() {
    let svg_element = draw.select('.SVG_Element,.ghost_path,.edit_rect,.init_node,.last_node,.close_node,.closePath_rect,.handle'); //非表示にする要素
    $('#display_DrawElement').prop('checked') ? svg_element.show() : svg_element.hide() //目盛り線以外のSVG描画要素は表示
  })
  $("#display_DrawElement").prop('checked', true).change();//初期状態はチェックを入れておく

  //画像の表示非表示チェックボックス
  $('#display_image').off('change').change( function() {
    ($('#display_image').prop('checked')) ? SVG.select('.image').show() : SVG.select('.image').hide();
  })
  $("#display_image").prop('checked', true).change();//初期状態はチェックを入れておく

  //グリッド線の表示非表示チェックボックス
  $('#display_gridline').off('change').change( function() {
    $('#display_gridline').prop('checked') ? SVG.get('gridline_group').show() : SVG.get('gridline_group').hide();
  })
  $("#display_gridline").prop('checked', false).change();//初期状態はチェックを入れておく

  //点字の日本語変換機能をチェックボックスと連結
  $('#trans_braille').off('change').change( function() {
    let font_family = ($('input[name="braillefont"]:checked').attr('id')==='IkarashiBraille_font') ? 'Ikarashi Braille' : '点字線なし'; //点字のタイプによって周囲を塗りつぶすか指定
    ($('#trans_braille').prop('checked')) ? draw.select('.braille').attr({'font-family':'メイリオ'}) : draw.select('.braille').attr({'font-family':font_family});
  })
  $("#trans_braille").prop('checked', false).change();//初期状態はチェックを入れないでおく

  /**********************************************
  //ガイドのサイズ（A4,B4,A3）を設定するラジオボタン
  ***********************************************/
  $( 'input[name="guiderect"]:radio' ).change( function() {
    draw.select('.A4 , .B4 , .A3').hide();
    if($(this).attr('id') === 'guiderect_A4'){
      draw.select('.A4').show();
    }else if($(this).attr('id') === 'guiderect_B4'){
      draw.select('.B4').show();
    }else{
      draw.select('.A3').show();
    }
  })
  $('input[name="guiderect"]#guiderect_A4').prop('checked', true).trigger('change');

  /**********************************************
  //ガイドの向き（横、縦）を設定するラジオボタン
  ***********************************************/
  $( 'input[name="direction_guide"]:radio' ).change( function() {
    if($(this).attr('id') === 'horizontal_guide'){
      draw.select('.A4 , .B4 , .A3').transform({rotation:0});
    }else{
      draw.select('.A4 , .B4 , .A3').transform({rotation:90});
    }
  })
  $('input[name="direction_guide"]#horizontal_guide').prop('checked', true).trigger('change'); //初期状態は横向き

  /*******************************
  点字フォント変更ラジオボタンの設定
  ********************************/
  $('input[name="braillefont"]:radio').off('change').on('change',function(){ //点字フォント変更ラジオボタンを変えたときに行う処理
    let font_family = ($('input[name="braillefont"]:checked').attr('id')==='IkarashiBraille_font') ? 'Ikarashi Braille' : '点字線なし'; //点字フォントの指定
    let font_strokewidth = ($('input[name="braillefont"]:checked').attr('id')==='IkarashiBraille_font') ? String(PS_WIDTH * 0.25) : '';//いからし点字の場合は0.25mmの輪郭を書く（発泡しやすくする）
    let font_strokecolor = ($('input[name="braillefont"]:checked').attr('id')==='IkarashiBraille_font') ? '#000000' : 'none';//輪郭線は黒色
    draw.select('.braille').attr({
      'font-family': font_family,
      'stroke': font_strokecolor,
      'stroke-width': font_strokewidth
    })
  })
  $('input[name="braillefont"]#IkarashiBraille_font').prop('checked', true).trigger('change');//初期状態はいからし点字にチェックを入れておく

  /*************************
  線種変更ラジオボタンの設定
  *************************/
  $('input[name="stroke"]:radio').off('change').on('change',function(){
    let drawing_path_selector = (now_drawing_path_ID === '' || now_drawing_path_ID === undefined) ? '' : ',#' + now_drawing_path_ID;
    if($(this).attr('id')==='radio_solid_path'){ //実線の場合
      draw.select('.edit_select.connected , .edit_select.circle , .fragmented' + drawing_path_selector).attr({'stroke-dasharray': ''});
      $('.dotted_option').hide();
    }else{ //点線の場合
      draw.select('.edit_select.connected,.edit_select.circle,.fragmented' + drawing_path_selector).attr({'stroke-dasharray': PS_WIDTH * $('#textbox_strokewidth').val()});
      $('.dotted_option').show();
    }
  })
  $("#radio_solid_path").prop('checked', true).change();//初期状態は実線にチェックを入れておく
  $('.dotted_option').hide(); //点線の設定情報は非表示に

  $('#dottedLine_line').off('focusout').on('focusout' , update_dottedLine);　//点線の実線部分の長さを指定するテキストボックスをフォーカスアウトしたときのイベント設定
  $('#dottedLine_line').val(1);

  $('#dottedLine_space').off('focusout').on('focusout' , update_dottedLine); //点線の空白部分の長さを指定するテキストボックスをフォーカスアウトしたときのイベント設定
  $('#dottedLine_space').val(1);

  $('#button_reset_dottedpath').click(function(){  //点線の詳細情報の線幅に合わせるボタンを押したときの処理
    $("#dottedLine_line").val($('#textbox_strokewidth').val());
    $("#dottedLine_space").val($('#textbox_strokewidth').val());
    let drawing_path_selector = (now_drawing_path_ID === '' || now_drawing_path_ID === undefined) ? '' : ',#' + now_drawing_path_ID;
    draw.select('.edit_select.path , .edit_select.circle , .fragmented' + drawing_path_selector).each(function(i,children){
      if(this.attr('stroke-dasharray')!==undefined && this.attr('stroke-dasharray')!==''){
        this.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
      }
    })
  })

  /*************************
  線色変更ガジェットの設定
  **************************/
  $("#custom_stroke_color").off('change').on("change", function(){
    let drawing_path_selector = (now_drawing_path_ID === '' || now_drawing_path_ID === undefined) ? '' : ',#' + now_drawing_path_ID;
     draw.select('.edit_select.path , .edit_select.circle , .fragmented' + drawing_path_selector).attr({'stroke' : $("#custom_stroke_color").val()});
     draw.select('.fragmented_PathGroup').attr({'stroke_tmp' : $("#custom_stroke_color").val()});
  });

  /*************************************************
  塗りつぶしラジオボタンの設定（線の描画モードで使うほう）
  **************************************************/
  $('input[name="draw_line_fillRadio"]:radio').off('change').on('change',function(){ //ラジオボタンを変えたときに行う処理
    let drawing_path_selector = (now_drawing_path_ID === '' || now_drawing_path_ID === undefined) ? '' : '#' + now_drawing_path_ID;
    draw.select(drawing_path_selector).fill($('input[name="draw_line_fillRadio"]:checked').val());
    if($('input[name="draw_line_fillRadio"]:checked').val()==='custom') draw.select(drawing_path_selector).fill($('#draw_fill_color').val());
  });
  $("#draw_fill_color").off('change').on("change", function(){ //カスタムの設定で色を変えたときに行う処理
     let drawing_path_selector = (now_drawing_path_ID === '' || now_drawing_path_ID === undefined) ? '' : '#' + now_drawing_path_ID;
     draw.select(drawing_path_selector).fill($('#draw_fill_color').val());
     $('#custom_fill_color').val($('#draw_fill_color').val());
     $("#draw_fill_custom").prop('checked', true);
  });

  /*************************************************
  塗りつぶしボタンの設定（選択モードで使うほう）
  **************************************************/
  $("#button_fillnone , #button_gray , #button_diagonal").click(change_fill);
  $("#button_polkadot , #button_polkadot_water").click(change_fill);
  $("#custom_fill_color").on('change',change_fill);

  function change_fill(){
    let fill = this.id==='custom_fill_color' ?  $('#custom_fill_color').val() :  $(this).val(); //カスタムの場合は、その色の値をfillに格納
    let fill_complete_flag = false; //fillの変更があった場合にtrue。 戻る、やり直し用の一時保存データを作成する
    draw.select(".edit_select , .fragmented_PathGroup").each(function(i,children){
      let fill_flag = false;
      if(this.hasClass('connected') || this.hasClass('circle')){
        fill_flag = true;
      }else if(SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'))){
        fill_flag = true;
      }
      if(fill_flag){
        fill_complete_flag = true;
        if(this.hasClass('fragmented_PathGroup')){
          SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number')).attr({'fill' : fill});
          this.attr({'fill_tmp': fill});
        }else{
          this.fill(fill);
        }
      }
    })
    if(fill_complete_flag) cash_svg();
  }

  /*****************************
  レイヤー変更ボタンの設定
  *****************************/
  $('#button_front , #button_forward , #button_backward , #button_back').click(function(e){
    let base;
    switch(this.id){
       case 'button_front': // 最前面ボタン（選択中の要素をレイヤーで一番前に移動する）
         draw.select('.edit_select, .fragmented_PathGroup').each(function(i , children){
           this.front();
           let ghost_path = SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'));
           if(ghost_path) this.before(ghost_path);
         })
         break;
       case 'button_forward': // 前面ボタン（選択中の要素をレイヤーで１つ前に移動する）
         draw.select('.edit_select, .fragmented_PathGroup').each(function(i , children){
           if(i===0){
             base = this;
             this.forward();
             if(this.previous()){
               if(this.previous().hasClass('frame_line')) this.forward();
             }
           }else{
             base.before(this);
           }
           let ghost_path = SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'));
           if(ghost_path) this.before(ghost_path);
         })
         break;
       case 'button_backward': // 背面ボタン（選択中の要素をレイヤーで一つ後ろに移動する）
         draw.select('.edit_select, .fragmented_PathGroup').each(function(i , children){
           if(i===0){
             base = this;
             this.backward();
             if(this.previous()){
               if(this.previous().hasClass('frame_line')) this.backward();
             }
           }else{
             base.after(this);
           }
           let ghost_path = SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'));
           if(ghost_path) this.before(ghost_path);
         })
         break;
       case 'button_back': // 最背面ボタン（選択中の要素をレイヤーで一番後に移動する）
         draw.select('.edit_select, .fragmented_PathGroup').each(function(i , children){
           if(i===0){
             base = this;
             this.back();
           }else{
             base.after(this);
           }
           let ghost_path = SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'));
           if(ghost_path) this.before(ghost_path);
         })
         break;
       default:
    }
    draw.select('.fragmented_RectGroup').front();
    SVG.get('guiderect_group').front();
    SVG.get('gridline_group').front();
    SVG.get('handle_group').front();
    draw.select('.image').back();
    draw.select('.image').each(function(i , children){
      this.back();
    })
    if(draw.select('.edit_select').first()) cash_svg();
  });

  /******************************************************
  //file_apiの設定(続きからの場合)
  ******************************************************/
  function fileClear() {
    this.value = null;
  }
  let inputFile_svg = $('#fileAPI_continue');
  let reader_svg = new FileReader();
  function fileChange_svg(ev) { //ファイル選択ボタンを押下時
    let file = ev.target.files[0];
    let type = file.type;
    if (type !== 'image/svg+xml') {
      alert('選択できるファイルはSVGファイルだけです。');
      inputFile.value = '';
      return;
    }
    reader_svg.readAsText(file);
  }
  function fileLoad_svg() {
    let svg_text = reader_svg.result;
    svg_text = svg_text.replace(/<svg.+>/g, ''); //<svg>タグが２つできてしまって都合が悪いので消す
    svg_text = svg_text.replace( /<\/svg>/g , "" ); //<svg>タグの閉じる側も同様に消す
    continue_setSVG(svg_text,-DRAW_AREA_WIDTH, -DRAW_AREA_HEIGHT, DRAW_AREA_WIDTH * 2, DRAW_AREA_HEIGHT * 2);
    cash_svg();
  }
  inputFile_svg.on('click',fileClear);
  inputFile_svg.on('change',fileChange_svg);
  $(reader_svg).on('load',fileLoad_svg);

  /*****************************************
  file_apiの設定(画像のインポートの場合)
  基本的にはファイルのインポートとほとんど同じ
  ******************************************/
  let inputFile_img = $('#fileAPI_img');
  let reader_img = new FileReader();
  function fileChange_img(ev) { //ファイル選択ボタンを押下時
    let file = ev.target.files[0];
    let type = file.type;
    if (!type.match('image.*')) {
      alert('選択できるファイルは画像ファイルだけです。');
      inputFile_img.value = '';
      return;
    }
    reader_img.readAsDataURL(file);
  }
  function fileLoad_img() {
    let image_url = reader_img.result; //画像の取り込み 引数には画像のアドレス
    let image = draw.image(image_url).loaded(function(loader) {
      this.size(loader.width, loader.height)
      this.addClass('image');
      draw.select('.image').back();
      draw.select('.image').each(function(i , children){
        this.back();
      })
      cash_svg();
      let Image_radio = $('#EditImage_div');
      (draw.select('.image').first()) ? Image_radio.show() : Image_radio.hide();
    })
  }
  inputFile_img.on('click',fileClear);
  inputFile_img.on('change',fileChange_img);
  $(reader_img).on('load',fileLoad_img);

  //元に戻すの処理
  $('#button_undo').click(undo);
  //やり直すの処理
  $('#button_redo').click(redo);
  //距離間チェック機能
  $('#distance_check_button').click(distance_check); //距離間チェックボタンクリック時に起動する関数を設定

  //線の補正機能
  $('#straight_connect_button').click(function(){
    fig_connect();
    fig_straight();
    fig_connect();
    fig_pathUpload();
    if(draw.select('.connected').first()) cash_svg();
  })

  //各モードを切り替えるラジオボタンの設定
  nowchecked = $('input[name="tg_mode"]:checked').val();
  $('input[name="tg_mode"]:radio').off('click').on('click',function(){
    RadioEvent_set();
  });
  RadioEvent_set();

  //スタンプ機能で使うラジオボタン（階段、エスカレータ...点字墨字とか）の設定
  $('input[name="tactileSymbol"]:radio').off('change').on('change',set_Stampmode);
  cash_svg();

  //アプリ起動時のメッセージを削除するボタンの処理
  $('#MessageHidden').click(function(){
    $('#start_message , #start_message_background').hide();
  })
}) //window.onload終了
