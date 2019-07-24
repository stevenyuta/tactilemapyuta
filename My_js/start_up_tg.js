/***************************************
//1.定数の設定
***************************************/
//svgデータのwidthとheightの定義
const DRAW_AREA_WIDTH = 1039.5;
const DRAW_AREA_HEIGHT = 735;

//A4サイズ(297mm × 210mm)に対するsvgデータのサイズの比率
//この値がSVGデータでの座標系における1mmに相当する
const SVG_RATIO = DRAW_AREA_WIDTH / 297;

//pathの属性について
const PATH_STROKE_COLOR = '#000' //通常時（黒色）
const PS_COLOR = '#000' //通常時（黒色）
const PATH_SELECT_COLOR = '#B22222' //選択時（赤色）
const PATH_EDIT_COLOR = '#0000CD' //詳細編集での選択時（青色）
const PATH_STROKE_WIDTH = SVG_RATIO //線幅（1mm）
const PS_WIDTH = SVG_RATIO //線幅（1mm）

const THRE_DISTANCE = 3 * SVG_RATIO //距離チェック時の閾値 3mm

//textの基本設定
const INK_FILL_COLOR = '#0066ff';//デフォルトの墨字の色
const BRA_FILL_COLOR = '#000';//デフォルトの点字の色
const DEF_INK_SIZE = '18'; //デフォルトの墨字サイズ
const DEF_BRA_SIZE = '20'; //デフォルトの点字サイズ
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

//階段、エスカレータ記号用定数（一応値を変えると形が変わる）
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

let cash_array = new Array(); //undo、redo機能用
let cash_pointer = 0;
let input_key_buffer = new Array(); //キー入力状態を保有
let arrIntervalCnt = new Array(); //タイマー処理のリセット用
let copy =  new Array(); //要素のコピー機能用
let viewbox_x = -DRAW_AREA_WIDTH , viewbox_y = -DRAW_AREA_HEIGHT; //現在のviewboxのx,yの値
let widthScrollBar_ratio , widthScrollBar_center;
let heightScrollBar_ratio , heightScrollBar_center;
let now_drawing_path_ID , drawing_path_dpoint="";
let now_movingFlag = false;
let nowchecked;

/******************************************
2.初期設定を行う
アプリを起動したときに１度だけ実行する
*******************************************/
$(window).on('load',function () {
  let userAgent = window.navigator.userAgent.toLowerCase();
  /**
  if(userAgent.indexOf('chrome') < 0 || userAgent.indexOf('edge') > 0){  //chrome以外のブラウザで表示した場合の処理
    $('.aplication_area').before('<p style="border: solid #808; padding:5px; font-size: 50px;">ブラウザはGoogle Chromeのみ対応しております<br>お使いのブラウザでは動作しません。<br>申し訳ございません。</p>');
    $('.aplication_area').before('<image width="500px"  src="images/sorry.png">');
    $('.aplication_area').hide();
  }else{
    **/
    //ウィンドウサイズ変更とアプリの余白を変更
    let timer = 0;
    window.onresize = function () { //ウィンドウサイズが変更した場合に実行
      if (timer > 0){
        clearTimeout(timer);
      }
      timer = setTimeout(function () {
        resize_aplication_area();
      }, 200);
    };
    resize_aplication_area();

    //2.1描画領域の初期設定
    continue_setSVG('',-DRAW_AREA_WIDTH, -DRAW_AREA_HEIGHT, DRAW_AREA_WIDTH * 2, DRAW_AREA_HEIGHT * 2);
    /****************************************
    点字墨字の大きさを設定するガジェットの設定
    主にアプリの右側に表示される
    ****************************************/
    /****************************************************************
    描画領域の表示範囲を指定する左右スクロールスライダー(SVGで描画)の設定
    *****************************************************************/
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

    /****************************************************************
    描画領域の表示範囲を指定する上下スクロールスライダー(SVGで描画)の設定
    *****************************************************************/
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

    $('#dottedLine_line').off('focusout').on('focusout' , update_dottedLine);
    $('#dottedLine_line').val(1);

    $('#dottedLine_space').off('focusout').on('focusout' , update_dottedLine);
    $('#dottedLine_space').val(1);

    $('#reset_dottedLine').click(function(){  //線幅リセットボタンを押下時の処理
      $("#dottedLine_line").val($('#StrokeWidth_TextBox').val());
      $("#dottedLine_space").val($('#StrokeWidth_TextBox').val());
      draw.select('.edit_select.path , .fragmented , .drawing_path').each(function(i,children){
        if(this.attr('stroke-dasharray')!==undefined && this.attr('stroke-dasharray')!==''){
          this.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
        }
      })
    })



    /************************************************************
    線幅を変更するテキストボックス、リセットボタン、スライダーの設定
    *************************************************************/
    $('#StrokeWidth_TextBox').off('focusout').on('focusout' , update_StrokeWidth_TextBox);
    $('#StrokeWidth_TextBox').val(1); //線幅の初期値を指定

    $('#resetStrokeWidth_Button').click(function(){  //線幅リセットボタンを押下時の処理
      $("#StrokeWidth_TextBox").val(1);
      draw.select('.edit_select.path , .fragmented , .drawing_path').each(function(i,children){
        this.attr({'stroke-width':PATH_STROKE_WIDTH});
        if(this.attr('stroke-dasharray')!== undefined && this.attr('stroke-dasharray')!=='') this.attr({'stroke-dasharray':PATH_STROKE_WIDTH});
      })
    });

    /**************************************************************
    //墨字サイズを変更するテキストボックス、リセットボタン、スライダーの設定
    **************************************************************/
    $('#resizeInk_TextBox').off('focusout').on('focusout' , update_resizeInk_TextBox);
    $('#resizeInk_TextBox').val(16); //墨字の初期値を指定

    $('#resetInk_Button').click(function(){  //リセットボタンを押下時の処理
      $("#resizeInk_TextBox").val(16);
      draw.select('.edit_select.ink').attr({'font-size': 16 * SVG_RATIO * 0.352778});
    }); //墨字の初期値を指定

    /*****************************************
    //点字の大きさを設定するスライダー
    ******************************************/
    $('#resizeBraille_TextBox').off('focusout').on('focusout' , update_resizeBraille_TextBox);
    $('#resizeBraille_TextBox').val(18); //墨字の初期値を指定

    $('#brasize_resetbutton').click(function(){  //リセットボタンを押下時の処理
      $("#resizeBraille_TextBox").val(18);
      draw.select('.edit_select.braille').attr({'font-size': 18 * SVG_RATIO * 0.352778});
    }); //点字の初期値を指定

    //墨字・点字のテキストボックスをフォーカスした時には文字入力モードへと自動的に変更する
    $('#InkChar , #Braille').off('focusin').on('focusin' ,function() {
      $('input[name="tactileSymbol"][value="Text"]').prop('checked', true);
      RadioEvent_set();
    })

    /*****************************************************************
    //画像透過度を変更するテキストボックス、リセットボタン、スライダーの設定
    ******************************************************************/
    $('#ImageOpacity_TextBox').off('focusout').on('focusout' , update_ImageOpacity_TextBox);
    $('#ImageOpacity_TextBox').val(100);

    $('#ImageOpacity_resetbutton').click(function(){  //リセットボタンを押下時の処理
      $("#ImageOpacity_TextBox").val(100);
      draw.select('.edit_select.image').attr({'opacity': 1});
    }); //墨字の初期値を指定


    /****************************************
    アプリ上のチェックボックスの初期設定を行う
    *****************************************/
    $("#check_ink").prop('checked', true).change();//初期ではスタンプ機能の文字の墨字はチェックを入れておく
    $("#check_bra").prop('checked', true).change();//初期ではスタンプ機能の文字の点字はチェックを入れておく
    /*********************************
    SVG要素の表示非表示チェックボックス
    **********************************/
    $('#display_DrawElement').off('change').change( function() {
      let svg_element = draw.select('.SVG_Element:not(.graduationFrame)');
      $('#display_DrawElement').prop('checked') ? svg_element.show() : svg_element.hide() //目盛り線以外のSVG描画要素は表示
    })
    $("#display_DrawElement").prop('checked', true).change();//初期状態はチェックを入れておく
    /*******************************
    //画像の表示非表示チェックボックス
    ********************************/
    $('#image').off('change').change( function() {
      ($('#image').prop('checked')) ? SVG.select('.image').show() : SVG.select('.image').hide();
    })
    $("#image").prop('checked', true).change();//初期状態はチェックを入れておく
    /*************************************
    //グリッド線の表示非表示チェックボックス
    **************************************/
    $('#gridline').off('change').change( function() {
      ($('#gridline').prop('checked')) ? SVG.get('gridline_group').attr({'display':'inline'}) : SVG.get('gridline_group').attr({'display':'none'});
    })
    $("#gridline").prop('checked', false).change();//初期状態はチェックを入れておく
    /******************************************
    //点字の日本語変換機能をチェックボックスと連結
    ******************************************/
    $('#trans_braille').off('change').change( function() {
      let font_family = ($('input[name="braillefont"]:checked').attr('id')==='IBfont') ? 'Ikarashi Braille' : '点字線なし';
      ($('#trans_braille').prop('checked')) ? draw.select('.braille').attr({'font-family':'メイリオ'}) : draw.select('.braille').attr({'font-family':font_family});
    })
    $("#trans_braille").prop('checked', false).change();//初期状態はチェックを入れないでおく
    /**************************************
    //目盛り枠の表示非表示チェックボックス
    ***************************************/
    $('#graduation_frame').off('change').change( function() {
      if(!draw.select('.graduationFrame').first()) add_graduationFrame();
      $('#graduation_frame').prop('checked') ? draw.select('.graduationFrame').show() : draw.select('.graduationFrame').hide()
    })
    $("#graduation_frame").prop('checked', false).change();//初期状態はチェックを入れないでおく
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
        //draw.select('.graduationFrame_group').first().transform({rotation:0});
      }else{
        draw.select('.A4 , .B4 , .A3').transform({rotation:90});
        //SVG.get('graduationFrame_group').transform({rotation:90});
      }
    })
    $('input[name="direction_guide"]#horizontal_guide').prop('checked', true).trigger('change');

    /*******************************
    点字フォント変更ラジオボタンの設定
    ********************************/
    $('input[name="braillefont"]:radio').off('change').on('change',function(){ //点字フォント変更ラジオボタンを変えたときに行う処理
      let font_family = ($('input[name="braillefont"]:checked').attr('id')==='IBfont') ? 'Ikarashi Braille' : '点字線なし'; //点字フォントの指定
      let font_strokewidth = ($('input[name="braillefont"]:checked').attr('id')==='IBfont') ? String(PATH_STROKE_WIDTH * 0.25) : '';//いからし点字の場合は0.25mmを輪郭線を書く
      let font_strokecolor = ($('input[name="braillefont"]:checked').attr('id')==='IBfont') ? '#000000' : 'none';//輪郭線は黒色
      draw.select('.braille').attr({
        'font-family': font_family,
        'stroke': font_strokecolor,
        'stroke-width': font_strokewidth
      })
    })
    $('input[name="braillefont"]#IBfont').prop('checked', true).trigger('change');//初期状態はいからし点字にチェックを入れておく

    /*************************
    線種変更ラジオボタンの設定
    *************************/
    $('input[name="stroke"]:radio').off('change').on('change',function(){
      if($(this).attr('id')==='solid_line'){ //実線の場合
        draw.select('.edit_select.connected , .fragmented , .drawing_path').attr({'stroke-dasharray': ''});
        $('.dotted_option').hide();
      }else{ //点線の場合
        draw.select('.edit_select.connected,.edit_select.circle,.fragmented,.drawing_path').attr({'stroke-dasharray': PS_WIDTH * $('#StrokeWidth_TextBox').val()});
        $('.dotted_option').show();
      }
    })
    $("#solid_line").prop('checked', true).change();//初期状態は実線にチェックを入れておく
    $('.dotted_option').hide();

    /*************************
    線色変更ガジェットの設定
    **************************/
    $("#stroke_color").off('change').on("change", function(){
       draw.select('.edit_select.path , .edit_select.circle , .fragmented ,.drawing_path').attr({'stroke' : $("#stroke_color").val()});
       draw.select('.fragmented_PathGroup').attr({'stroke_tmp' : $("#stroke_color").val()});
    });

    /*************************************************
    塗りつぶしラジオボタンの設定（線の描画モードで使う）
    **************************************************/
    $('input[name="draw_line_fillRadio"]:radio').off('change').on('change',function(){ //ラジオボタンを変えたときに行う処理
      draw.select('.drawing_path').fill($('input[name="draw_line_fillRadio"]:checked').val());
      if($('input[name="draw_line_fillRadio"]:checked').val()==='custom') draw.select('.drawing_path').fill($('#draw_fill_color').val());
    });
    $("#draw_fill_color").off('change').on("change", function(){ //カスタムの設定色を変えたときに行う処理
       draw.select('.drawing_path').fill($('#draw_fill_color').val());
       $('#fill_color').val($('#draw_fill_color').val());
       $("#draw_fill_custom").prop('checked', true);
    });

    /*************************************************
    塗りつぶしボタンの設定（選択モードで使う）
    **************************************************/
    $("#fillnone_button , #gray_button , #diagonal_button").click(change_fill);
    $("#polkadot_button , #polkadot_water_button").click(change_fill);
    $("#fill_color").on('change',change_fill);

    function change_fill(){
      let fill
      this.id==='fill_color' ? fill = $('#fill_color').val() : fill = $(this).val();
      let fill_complete_flag = false; //fillの変更があった場合にtrue 戻る、やり直し用の一時保存データを作成する
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
    $('#front_button , #forward_button , #backward_button , #back_button').click(function(e){
      let base;
      switch(this.id){
         case 'front_button': // ← key
           draw.select('.edit_select, .fragmented_PathGroup').each(function(i , children){
             this.front();
             let ghost_path = SVG.get('#ghost_path_' + this.attr('fragmented_Group_Number'));
             if(ghost_path) this.before(ghost_path);
           })
           break;
         case 'forward_button': // ← key
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
         case 'backward_button': // ← key
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
         case 'back_button': // ← key
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
      draw.select('.fragmented_RectGroup').each(function(i , children){
        this.front();
      })
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
      svg_text = svg_text.replace(/<svg.+>/g, '')
      svg_text = svg_text.replace( /<\/svg>/g , "" );
      continue_setSVG(svg_text,-DRAW_AREA_WIDTH, -DRAW_AREA_HEIGHT, DRAW_AREA_WIDTH * 2, DRAW_AREA_HEIGHT * 2);
      cash_svg();
    }
    inputFile_svg.on('click',fileClear);
    inputFile_svg.on('change',fileChange_svg);
    $(reader_svg).on('load',fileLoad_svg);

    /*****************************************
    file_apiの設定(画像のインポートの場合)
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

    /******************************
    元に戻すの処理
    *******************************/
    $('#undo').click(undo);
    /******************************
    やり直すの処理
    *******************************/
    $('#redo').click(redo);
    /******************************
    距離間チェック機能
    ******************************/
    $('#distance_check_button').click(distance_check); //距離間チェックボタンクリック時に起動する関数を設定
    /******************************
    線の補正機能
    ******************************/
    $('#straight_connect_button').click(function(){
      fig_connect();
      fig_straight();
      fig_connect();
      fig_pathUpload();
      if(draw.select('.connected').first()) cash_svg();
    })

    /*******************************
    //各モードのラジオボタンの設定
    ********************************/
    nowchecked = $('input[name="tg_mode"]:checked').val();
    $('input[name="tg_mode"]:radio').off('click').on('click',function(){
      RadioEvent_set();
    });
    RadioEvent_set();

    /**************************************************************
    スタンプ機能で使うラジオボタン（階段、エスカレータ...点字墨字とか）
    ***************************************************************/
    $('input[name="tactileSymbol"]:radio').off('change').on('change',set_Stampmode);
    cash_svg();

    $('#MessageHidden').click(function(){
      $('#start_message , #start_message_background').hide();
    })
  //}
}) //window.onload終了
