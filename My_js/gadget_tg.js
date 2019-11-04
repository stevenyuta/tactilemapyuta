/*************************************
//モードを変更したときに行う関数
*************************************/
function RadioEvent_set(unredo_flag){
  //現在のモードの記憶
  nowchecked = $('input[name="tg_mode"]:checked').val();
  //画像がある場合は画像選択モードに切り替えられるように表示させる
  draw.select('.image').first() ? $('#EditImage_div , #checkbox_image').show() : $('#EditImage_div , #checkbox_image').hide();
  //ページ上のイベントの削除
  $(document).off();
  //描画領域のイベント削除
  draw.off();
  //SVG_Element、画像のイベント解除と触れたときのマウスカーソルのデフォルト化
  draw.select('.SVG_Element , .image').off().attr({'cursor':'default'});
  //幅と高さのテキストボックスのイベント解除
  $('#textbox_selectBox_width , #textbox_selectBox_height').off();
  //
  draw.select('.connected').each(function(i,children){
    if(this.clear().array().settle().length < 2) this.remove();
  })
  selector_delete('.dummy');
  selector_delete('.edit_rect , .init_node , .last_node , .close_node');
  selector_delete('.select_rect');
  selector_delete('.fragmented_RectGroup');

  //キーボードを押したときの処理の設定
  set_key_down_up();
  //右クリックメニューに関する設定
  set_contextMenu();
  //マウスホイールで拡大縮小などを行う処理の設定
  set_zoom();
  //線編集機能で編集状態にした線を元に戻す
  toConnected();
  //選択状態の解除
  if(nowchecked!=='Edit') edit_clear(true);
  //いらない要素を全削除
  get_node_connectRect();

  /** アプリ右側に表示されるメニューを全て一旦隠す**/
  //線の太さ、色変更
  $('.stroke_option , .dotted_option').hide();
  //墨字サイズ変更
  $('.gadget_resizeInk').hide();
  //点字サイズ変更
  $('.gadget_resize_braille').hide();
  //文字内容表示・変更テキストボックス
  $('.gadget_textInfo').hide();
  //画像透過度変更
  $('.gadget_imageOpacity').hide();
  //線や四角形、円を描くときの塗りつぶしの設定
  $('#table_draw_fill').hide();
  //レイヤ変更
  $('#table_layer').hide();
  //選択状態の塗りつぶし変更
  $('#table_select_fill').hide();
  //スタンプの選択
  $('#table_stamp').hide();
  //線の自動補正ボタン
  $('#straight_connect_button').hide();
  //選択モード時の選択ボックス（選択している要素の大きさを示す）の設定
  $('.resizeBox_textbox').hide();

  draw.off('mousemove').mousemove(function(e){
    mx = getmousepoint('normal',event).x; //描画領域上でのマウスポイント計算
    my = getmousepoint('normal',event).y;
  });


  /*************************************
  //各モードごとの処理
  *************************************/
  switch(nowchecked){
    case 'Draw':
      //右側に表示される線種線色などの設定欄の表示
      $('.stroke_option').show();
      if($('input[name="stroke"]:checked').attr('id')==='radio_dotted_path') $('.dotted_option').show();
      $('#table_draw_fill').show();
      draw_path(); //draw_tg.jsファイルに詳しく色々かいてある
      break;
    case 'Edit':
      $('.resizeBox_textbox').show(); //edit_tg.jsファイルを参照
      edit();
      break;
    case 'EditPath':
      editpath(); //editpath_tg.jsファイルを参照
      break;
    case 'DrawRect':
      $('.stroke_option').show();
      if($('input[name="stroke"]:checked').attr('id')==='radio_dotted_path') $('.dotted_option').show();
      $('#table_draw_fill').show();
      //四角形描画モードの開始 stamp_tg.jsファイルを参照
      draw_rect();
      break;
    case 'EditImage':
      $('.resizeBox_textbox').show();
      //画像のみの選択モード　使う関数も選択モードと同じ　edit_tg.jsファイルを参照
      edit();
      break;
    case 'DrawCircle':
      $('.stroke_option').show();
      if($('input[name="stroke"]:checked').attr('id')==='radio_dotted_path') $('.dotted_option').show();
      $('#table_draw_fill').show();
      //円の描画モード stamp_tg.jsファイルを参照
      draw_circle();
      break;
    case 'Stamp':
      $('#table_stamp').show();
      //スタンプ（文字or記号）モードの開始 stamp_tg.jsファイルを参照
      set_Stampmode();
      break;
    default:
      break;
  }

  if(nowchecked!=="Draw"){
    let current_path = SVG.get('#'+now_drawing_path_ID);
    if(current_path){
      if(!unredo_flag) current_path.attr({'d' : drawing_path_dpoint});
      now_drawing_path_ID = "";
      drawing_path_dpoint = "";
    }
  }
}

/******************************************************
/右クリックメニューの設定
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
          (copy.length===0) ? flag = true : flag = false;
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
          SVG.get('#' + now_drawing_path_ID) ? flag = false : flag = true;
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
//グリッド線を描画する関数
******************************************************/
function draw_gridline(range_x,range_y,interval_x,interval_y){
  //最初にグリッド線が既に描画されていた場合はそれを削除
  if(SVG.get('gridline_group')) SVG.get('gridline_group').remove();
  //グリッド線を格納するグループを作成
  let gridline_group =  draw.group().attr({ id: 'gridline_group' }).front();
  //縦方向の線を引数のパラメータに従って描画
  for(let i=-range_x; i<=range_x; i+=interval_x){
    let line = draw.line(i, range_y, i, -range_y).attr({
      'stroke-width': 1,
      'stroke-dasharray': '1 5'
    });
    if(i===0) line.attr({'stroke' : '#ff0000'}).attr({ 'stroke-width': 2 });
    gridline_group.add(line);
  }
  //横方向の線を引数のパラメータに従って描画
  for(let i=-range_y; i<=range_y; i+=interval_y){
    let line = draw.line(range_x, i, -range_x, i).attr({
      'stroke-width': 1,
      'stroke-dasharray': '1 5'
    });
    if(i===0) line.attr({'stroke' : '#ff0000'}).attr({ 'stroke-width': 2 });
    gridline_group.add(line);
  }
  //グリッド線の表示非表示チェックボックスがチェックされていない場合はグリッド線を非表示にする
  if(!$('#display_gridline').prop('checked')) gridline_group.hide();
}

/********************************************************************
PNGダウンロード時などにダウンロードエリアを指定するガイド枠を描画する関数
********************************************************************/
function draw_guiderect(){
  //既にガイドが描画されていない場合に描画する
  if(SVG.get('guiderect_group')===null){
    //ダウンロードに使うガイドを格納するグループを作成
    let guiderect_group = draw.group().attr({ id: 'guiderect_group' }).front();
    //A4のガイドを作成
    let guiderectA4 = draw.rect(GUIDE_WIDTH_A4 + 2 * GUIDE_STROKE_WIDTH , GUIDE_HEIGHT_A4 + 2 * GUIDE_STROKE_WIDTH);
    guiderectA4.addClass('guiderect').addClass('A4').front();
    guiderectA4.attr({
      'x' : -GUIDE_WIDTH_A4/2 - GUIDE_STROKE_WIDTH,
      'y' : -GUIDE_HEIGHT_A4/2 - GUIDE_STROKE_WIDTH,
      'fill':'none', 'stroke': GUIDE_STROKE_COLOR_A4, 'stroke-width': GUIDE_STROKE_WIDTH
    });
    guiderect_group.add(guiderectA4);

    //B4のガイドを作成
    let guiderectB4 = draw.rect(GUIDE_WIDTH_B4 + 2 * GUIDE_STROKE_WIDTH , GUIDE_HEIGHT_B4 + 2 * GUIDE_STROKE_WIDTH);
    guiderectB4.addClass('guiderect').addClass('B4').front();
    guiderectB4.attr({
      'x': -GUIDE_WIDTH_B4 / 2 - GUIDE_STROKE_WIDTH,
      'y': -GUIDE_HEIGHT_B4 / 2 - GUIDE_STROKE_WIDTH, //x,y座標の設定
      'fill':'none', 'stroke': GUIDE_STROKE_COLOR_B4, 'stroke-width': GUIDE_STROKE_WIDTH
    });
    guiderect_group.add(guiderectB4);

    //A3のガイドを作成
    let guiderectA3 = draw.rect(GUIDE_WIDTH_A3 + 2 * GUIDE_STROKE_WIDTH , GUIDE_HEIGHT_A3 + 2 * GUIDE_STROKE_WIDTH);
    guiderectA3.addClass('guiderect').addClass('A3').front();
    guiderectA3.attr({
      'x': -GUIDE_WIDTH_A3 / 2 - GUIDE_STROKE_WIDTH,
      'y': -GUIDE_HEIGHT_A3 / 2 - GUIDE_STROKE_WIDTH, //x,y座標の設定
      'fill':'none', 'stroke': GUIDE_STROKE_COLOR_A3, 'stroke-width': GUIDE_STROKE_WIDTH
    });
    guiderect_group.add(guiderectA3);
  }

  //ガイドの初期状態を決める
  //初期状態：A4を長辺を横向きで表示
  draw.select('A4 , .B4 , .A3').hide();
  if($( 'input[name="guiderect"]:checked' ).attr('id') === 'guiderect_A4'){
    draw.select('.A4').show();
  }else if($('input[name="guiderect"]:checked').attr('id')==='guiderect_B4'){
    draw.select('.B4').show();
  }else{
    draw.select('.A3').show();
  }
  if($('input[name="direction_guide"]:checked').attr('id') === 'horizontal_guide'){
    draw.select('.A4, .B4 , .A3').transform({rotation:0});
  }else{
    draw.select('.A4 , .B4 , .A3').transform({rotation:90});
  }
}

//チェックボックスの設定に合わせて描画したものを表示非表示させたりする
function checkBox_change(){
  //SVG要素の表示非表示チェックボックス
  let svg_element = draw.select('.SVG_Element,.ghost_path,.edit_rect,.init_node,.last_node,.close_node,.closePath_rect,.handle');
  $('#display_DrawElement').prop('checked') ? svg_element.show() : svg_element.hide();
  //画像の表示非表示
  $('#display_image').prop('checked') ? SVG.select('.image').show() : SVG.select('.image').hide();
  //グリッド線の表示非表示
  $('#display_gridline').prop('checked') ? SVG.get('gridline_group').show() : SVG.get('gridline_group').hide();
  //点字の日本語変換
  let font_family = ($('input[name="braillefont"]:checked').attr('id')==='IkarashiBraille_font') ? 'Ikarashi Braille' : '点字線なし';
  $('#trans_braille').prop('checked') ? draw.select('.braille').attr({'font-family':'メイリオ'}) : draw.select('.braille').attr({'font-family':font_family});

  //ガイドの四角形がA4かB4か
  draw.select('.A4 , .B4 ,.A3').hide();
  if($( 'input[name="guiderect"]:checked' ).attr('id') === 'guiderect_A4'){
    draw.select('.A4').show();
  }else if($( 'input[name="guiderect"]:checked' ).attr('id') === 'guiderect_B4'){
    draw.select('.B4').show();
  }else{
    draw.select('.A3').show();
  }
  //ガイドの四角形が横か縦か
  let guiderect = draw.select('.A4 , .B4 , .A3');
  $('input[name="direction_guide"]:checked').attr('id')==='horizontal_guide' ? guiderect.transform({rotation:0}) : guiderect.transform({rotation:90});
}

/***********************************************************
//描画領域上のマウスホイールを使用したときにズームする機能の実装
************************************************************/
function set_zoom(){
  //zoomの導入　詳しくはライブラリの使い方を見てくれ
  draw.panZoom({
    doPanning: false,
    zoomFactor: 0.2,
    zoomMin: 0.35,
    zoomMax: 5
  })
  let mousewheelevent = 'onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll';
  //マウスホイールを動かしたときの処理
  $('#draw_area').off(mousewheelevent).on(mousewheelevent,function(e){
    e.preventDefault();
    //ズームレベルの取得
    let zoom_lvl = draw.zoom();
    //viewboxの取得
    let vb = draw.viewbox();

    //変更されたviewboxを元に左右と上下のスクロールバーを移動させる
    viewbox_x = vb.x , viewbox_y = vb.y
    widthScrollBar_ratio = (4000 - draw.viewbox().width)/940;
    widthScrollBar_center = 2000 + draw.viewbox().x;

    if(widthScrollBar_center/widthScrollBar_ratio <= 0){
      draw.viewbox(-2000 , vb.y , vb.width , vb.height);
      SVG.get('width_handle').attr({'x' : 0});
    }else if(widthScrollBar_center/widthScrollBar_ratio >= 940){
      draw.viewbox(2000 - vb.width , vb.y , vb.width , vb.height);
      SVG.get('width_handle').attr({'x' : 940});
    }else{
      SVG.get('width_handle').attr({'x' : widthScrollBar_center/widthScrollBar_ratio});
    }

    heightScrollBar_ratio = (4000 - draw.viewbox().height)/635;
    heightScrollBar_center = 2000 + draw.viewbox().y;

    if(heightScrollBar_center/heightScrollBar_ratio <= 0){
      draw.viewbox(vb.x , -2000 , vb.width , vb.height);
      SVG.get('height_handle').attr({'y' : 0});
    }else if(heightScrollBar_center/heightScrollBar_ratio >= 635){
      draw.viewbox(vb.x , 2000 - vb.height , vb.width , vb.height);
      SVG.get('height_handle').attr({'y' : 2000});
    }else{
      SVG.get('height_handle').attr({'y' : heightScrollBar_center/heightScrollBar_ratio});
    }

    //選択モード時に使うハンドルの大きさをズームレベルに合わせて変更する
    //定数はかなり適当
    SVG.get('handle_group').each(function(i , children){
      if(this.type === 'circle') this.radius(SELECT_HANDLE_RADIUS/(2*zoom_lvl));
      if(this.attr('id') === 'rot_resize') this.attr({'cy' : Number(SVG.get('t_resize').attr('cy')) - 15/zoom_lvl});
    })
    draw.select('.svg_select_points').attr({'r':SELECT_HANDLE_RADIUS/(2*zoom_lvl)});
    draw.select('.svg_select_points_rot').attr({ 'r':SELECT_HANDLE_RADIUS/(2*zoom_lvl) });

    //edit_node:線編集時にノードを表現する四角形
    //close_node:線描画時の終点と始点を繋ぐときの四角形
    SVG.select('.edit_rect , .close_node').each(function(i , children){
      let origi_cx = this.x() + this.width()/2 , origi_cy = this.y() + this.height()/2;
      this.width(RECT_WIDTH/(1.5*zoom_lvl));
      this.height(RECT_HEIGHT/(1.5*zoom_lvl));
      this.attr({'x' : origi_cx - this.width()/2, 'y' : origi_cy - this.height()/2 });
    })
    //init_node , last_node:それぞれ線描画時に始点と終点ノードを表現する四角形
    SVG.select('.init_node , .last_node').each(function(i , children){
      let origi_cx = this.x() + this.width()/2 , origi_cy = this.y() + this.height()/2;
      this.width(RECT_WIDTH/(2.5*zoom_lvl));
      this.height(RECT_HEIGHT/(2.5*zoom_lvl));
      this.attr({'x' : origi_cx - this.width()/2, 'y' : origi_cy - this.height()/2 });
    })
  });
}

/*****************************************
引数に入った文字列を数字に変換して返す関数
******************************************/
function leaveOnlyNumber(String_num){
  let converted = String_num.replace(/[０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
  });
  let array = converted.match(/[0-9]+\.?[0-9]*/g);
  return array[0]
}


/*****************************************************************
点線の幅のテキストボックスの内容に合わせて点線の情報を変化させる関数
******************************************************************/
function update_dottedLine(){
  if(String($('#dottedLine_line').val())!==""){
    let transNumber = leaveOnlyNumber($('#dottedLine_line').val());
    $('#dottedLine_line').val(transNumber);
    if(!transNumber.match(/[^0-9\.]/)){
      let drawing_path_selector = (now_drawing_path_ID === '' || now_drawing_path_ID === undefined) ? '' : ',#' + now_drawing_path_ID;
      draw.select('.edit_select.path , .edit_select.circle , .fragmented' + drawing_path_selector).each(function(i,children){
        if(this.attr('stroke-dasharray')!==undefined && this.attr('stroke-dasharray')!==''){
          this.attr({ 'stroke-dasharray': PS_WIDTH * $('#dottedLine_line').val() + ' ' +  PS_WIDTH * $('#dottedLine_space').val()});
        }
      })
    }
  }
}

/*****************************************************************
線幅変更用のテキストボックスに値が入力されて決定されたときに実行する関数
テキストボックスの値に従って線幅を変更する
******************************************************************/
function update_textbox_strokewidth(){
  if(String($('#textbox_strokewidth').val())!==""){
    let transNumber = leaveOnlyNumber($('#textbox_strokewidth').val());
    $('#textbox_strokewidth').val(transNumber);
    if(!transNumber.match(/[^0-9\.]/)){
      let drawing_path_selector = (now_drawing_path_ID === '' || now_drawing_path_ID === undefined) ? '' : ',#' + now_drawing_path_ID;
      draw.select('.edit_select.path , .edit_select.circle , .fragmented' + drawing_path_selector).each(function(i,children){
        this.attr({'stroke-width': Number(transNumber) * PS_WIDTH });
        if(this.attr('stroke-dasharray')!==undefined && this.attr('stroke-dasharray')!=='')this.attr({'stroke-dasharray': PS_WIDTH});
      })
    }
  }
}

/********************************************************************************
墨字のフォントサイズ変更用のテキストボックスに値が入力されて決定されたときに実行する関数
テキストボックスの値に従って墨字のフォントサイズを変更する
********************************************************************************/
function update_resizeInk_TextBox(){
  if(String($('#textbox_resize_ink').val())!==""){
    let transNumber = leaveOnlyNumber($('#textbox_resize_ink').val());
    $('#textbox_resize_ink').val(transNumber);
    if(!transNumber.match(/[^0-9\.]/)){
      draw.select('.edit_select.ink').attr({ 'font-size': Number(transNumber) * SVG_RATIO * 0.352778 });
    }
  }
}

/********************************************************************************
点字のフォントサイズ変更用のテキストボックスに値が入力されて決定されたときに実行する関数
テキストボックスの値に従って点字のフォントサイズを変更する
********************************************************************************/
function update_resizeBraille_TextBox(){
  if(String($('#textbox_resize_braille').val())!==""){
    let transNumber = leaveOnlyNumber($('#textbox_resize_braille').val());
    $('#textbox_resize_braille').val(transNumber);
    if(!transNumber.match(/[^0-9\.]/)){
      draw.select('.edit_select.braille').attr({ 'font-size': Number(transNumber) * SVG_RATIO * 0.352778 });
    }
  }
}

/********************************************************************************
画像の透過度変更用のテキストボックスに値が入力されて決定されたときに実行する関数
テキストボックスの値に従って画像の透過度を変更する
********************************************************************************/
function update_textbox_image_opacity(){
  if(String($('#textbox_image_opacity').val())!==""){
    let transNumber = leaveOnlyNumber($('#textbox_image_opacity').val());
    $('#textbox_image_opacity').val(transNumber)
    if(!transNumber.match(/[^0-9\.]/)){
      draw.select('.edit_select.image').attr({ 'opacity' : Number(transNumber)/100 });
    }
  }
}

/*******************************************************************************************************************
描画領域でのマウス位置を計算し、返す関数
modeごとに動作が違う
normal   ⇒  普通に座標を返す
connect　⇒　近傍の線(path)に近づくと自動的にくっつくようにマウス座標を返す
15degree ⇒　引数のpxとpyを基準点として、そこから15度刻みでマウス座標を返す　線の描画モードでctrlキーを押しながら描くときを見てほしい
90degree ⇒  15degreeの90度版。線の詳細編集でのctrlキーを押しな柄の移動に使う
********************************************************************************************************************/
function getmousepoint(mode , mouseevent , px , py){
  let mouse = new Object();
  if(mode==="connect"){
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    let thre_xy = RECT_WIDTH/(3*draw.zoom()); //線へ自動接続される範囲
    let ci="EMPTY",cj="EMPTY",ck="EMPTY";
    let Min_dis = "EMPTY" , thre_Min_dis=RECT_WIDTH/(3*draw.zoom());
    let mini_pA, mini_pB, mini_pC;
    let mini_x1 , mini_y1 , mini_x2 , mini_y2;
    let path_x1 , path_y1 , path_x2 , path_y2;
    draw.select('.connected').each(function(i,children){
      if(this.id() !== now_drawing_path_ID){
        let dpoint = this.clear().array().settle() //pathのdpoint配列を取得
        for(let j=0; j < dpoint.length - 1; j++){
          if(dpoint[j + 1][0] !== 'Z'){
            path_x1 = Number( dpoint[j][1]) , path_y1 = Number( dpoint[j][2])
            path_x2 = Number( dpoint[j + 1][1]) , path_y2 = Number( dpoint[j + 1][2])
          }else{
            path_x1 = Number( dpoint[j][1]) , path_y1 = Number( dpoint[j][2])
            path_x2 = Number( dpoint[0][1]) , path_y2 = Number( dpoint[0][2])
          }

          let pA = -Number(path_y2) + Number(path_y1)//補正前の直線パラメータのa,b,c
          let pB =  Number(path_x2) - Number(path_x1)
          let pC = -pA * Number(path_x1) - pB * Number(path_y1);

          let x1 = path_x1  //座標パラメータ取得
          let y1 = path_y1
          let x2 = path_x2
          let y2 = path_y2

          let relativeXY = get_relativeXY(x1,y1,x2,y2,thre_xy); //直線の領域のx,y座標

          if(mx < relativeXY.max_x && mx > relativeXY.min_x && my < relativeXY.max_y && my > relativeXY.min_y){ //マウスポイントが閾値の領域内にあったら
            let dis = Math.abs(pA * mx + pB * my + pC)/Math.sqrt(pA * pA + pB * pB); //直線とマウスポイントの距離
            if(Min_dis==="EMPTY"){ //Min_disがEMPTY(一度も書き換えられていない)
              Min_dis = dis;
              mini_pA = pA , mini_pB = pB , mini_pC = pC
              mini_x1= x1 , mini_y1= y1 , mini_x2= x2 , mini_y2= y2
            }else{
              if(Min_dis > dis){
                Min_dis = dis; //disが最小ならば
                mini_pA = pA , mini_pB = pB , mini_pC = pC
                mini_x1= x1 , mini_y1= y1 , mini_x2= x2 , mini_y2= y2
              }
            }
          }
        }
      }
    })
    if(Min_dis!=="EMPTY" && Min_dis < thre_Min_dis){ //Min_disがEMPTYでなく、1以下なら
      let relativeXY = get_relativeXY(mini_x1,mini_y1,mini_x2,mini_y2,thre_xy); //直線の領域のx,y座標
      let change_x = (mini_pB * mini_pB * mx - mini_pA * mini_pB * my - mini_pA * mini_pC)/(mini_pA * mini_pA + mini_pB * mini_pB);
      let change_y =  - (mini_pA * mini_pB * mx - mini_pA * mini_pA * my + mini_pB * mini_pC)/(mini_pA * mini_pA + mini_pB * mini_pB);
      if(change_x < (relativeXY.min_x + thre_xy) )  change_x = relativeXY.min_x + thre_xy;
      if(change_x > (relativeXY.max_x - thre_xy) )  change_x = relativeXY.max_x - thre_xy;
      if(change_y < (relativeXY.min_y + thre_xy) )  change_y = relativeXY.min_y + thre_xy;
      if(change_y > (relativeXY.max_y - thre_xy) )  change_y = relativeXY.max_y - thre_xy;
      mx = change_x;
      my = change_y;
    }
    mouse.x = mx;
    mouse.y = my;
  }else if(mode==='15degree'){
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    let atan = Math.atan((my-py)/(mx-px)); //角度計算
    let norm = Math.sqrt( (my-py)*(my-py) + (mx-px)*(mx-px) );
    let arg = Math.round(atan*12/Math.PI)*Math.PI/12;
    let line_a = Math.tan(arg) , line_b = -1 , line_c = py - px * line_a;
    let connect_x = (line_b * line_b * mx - line_a * line_b * my - line_a * line_c)/(line_a * line_a + line_b * line_b);
    let connect_y =  - (line_a * line_b * mx - line_a * line_a * my + line_b * line_c)/(line_a * line_a + line_b * line_b);
    mx = connect_x;
    my = connect_y;
    mouse.x = mx;
    mouse.y = my;

  }else if(mode==='90degree'){
    mx = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    my = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
    if(mx !== px){
      let atan = Math.atan((my-py)/(mx-px));
      let norm = Math.sqrt( (my-py)*(my-py) + (mx-px)*(mx-px) );
      let arg = Math.round(atan*2/Math.PI)*Math.PI/2;
      let line_a = Math.tan(arg);
      let line_b = -1;
      let line_c = py-px*line_a;
      let connect_x = (line_b * line_b * mx - line_a * line_b * my - line_a * line_c)/(line_a * line_a + line_b * line_b);
      let connect_y =  - (line_a * line_b * mx - line_a * line_a * my + line_b * line_c)/(line_a * line_a + line_b * line_b);
      mx = connect_x
      my = connect_y
    }
    mouse.x = mx;
    mouse.y = my;
  }else if(mode==='normal'){
    mouse.x = (mouseevent.pageX-Number($('#draw_area').offset().left))/draw.viewbox().zoom+Number(draw.viewbox().x); //描画領域上でのマウスポイント計算
    mouse.y = (mouseevent.pageY-Number($('#draw_area').offset().top))/draw.viewbox().zoom+Number(draw.viewbox().y);
  }
  return mouse;
}

/***************************
「元に戻す」を実行する関数
****************************/
function undo(){
  if(cash_array.length > cash_pointer + 1){  //cash_arrayにデータがある場合
    //現在のモードとviewboxの情報を記憶しておく
    let current_mode =  $('input[name="tg_mode"]:checked');
    let vx = draw.viewbox().x , vy = draw.viewbox().y;
    let vwidth = draw.viewbox().width , vheight = draw.viewbox().height;

    //draw_areaの削除
    $('#draw_area').remove();
    //draw_includeの中にもう１度draw_area(divタグ)を作成
    $("#draw_include").append($('<div id="draw_area"></div>'));
    //draw_areaの中にsvgを再定義
    draw = SVG('draw_area').size(DRAW_AREA_WIDTH,DRAW_AREA_HEIGHT).attr('id','svg_draw_area');
    //viewboxも再定義
    draw.viewbox(vx, vy, vwidth, vheight);
    //cash_arrayの中に記載されているsvgデータを書き込み
    draw.svg(cash_array[++cash_pointer]);
    //グリッド線を描画(グリッド線はデータが大きいので消しておいてあった)
    draw_gridline(3000,3000,75,75);
    //defs（塗りつぶし機能に使う）の設定
    defs_set();
    checkBox_change();
    toConnected();
    edit_clear();
    RadioEvent_set(true);
    js_sleep(100); //100ms待機
  }
  //元に戻す、やり直しができる状態かを判別し、ボタンの有効化などを設定する
  undredo_checker();
}

/*************************
「やり直す」を実行する関数
**************************/
function redo(){
  if(cash_pointer > 0){  //cash_arrayにデータがある場合
    //↓基本的には元に戻すと操作は同じ
    let current_mode =  $('input[name="tg_mode"]:checked');
    let vx = draw.viewbox().x , vy = draw.viewbox().y;
    let vwidth = draw.viewbox().width , vheight = draw.viewbox().height;

    $('#draw_area').remove();
    $("#draw_include").append($('<div id="draw_area"></div>'));

    draw = SVG('draw_area').size(DRAW_AREA_WIDTH,DRAW_AREA_HEIGHT).attr('id','svg_draw_area');
    draw.viewbox(vx, vy, vwidth, vheight);
    draw.svg(cash_array[--cash_pointer]);

    draw_gridline(3000,3000,75,75);
    defs_set();
    checkBox_change();
    toConnected();
    edit_clear();
    RadioEvent_set(true);
    js_sleep(100); //100ms待機
  }
  undredo_checker();
}

/************************************
//引数に入れたselectorを全て削除する関数
************************************/
function selector_delete(selector){
  draw.select(selector).each(function(i,children){
    this.remove();
  })
}

/******************************************************
//塗りつぶし用のテクチャ属性を定義する関数
//defsタグの設定
******************************************************/
function defs_set(){
  draw.select('.pattern').each(function(i, children){
    this.remove()
  })
  let diameter = 1.5 * SVG_RATIO; //直径:1.5mm
  let defs_width = 3.5 * SVG_RATIO;
  let defs_height = 6 * SVG_RATIO;
  //斜線
  let diagonal_pattern = draw.pattern(8, 8, function(add) {
    add.rect(8 , 8).attr({
      'fill' : '#fff'
    })
    add.line(6.5 , 0 , 6.5 , 8).attr({
      'stroke' : '#000000',
      'stroke-width' : '1.5'
    })
  })
  diagonal_pattern.attr({
    'id' : 'diagonal-texture',
    'patternTransform' : 'rotate(45)'
  }).addClass('pattern');

  //水玉模様（白色）
  let polkadot_pattern = draw.pattern(defs_width, defs_height, function(add) {
    add.rect(defs_width , defs_height).attr({
      'fill' : '#fff'
    })
    add.circle(diameter).attr({
      'cx' : defs_width/2,
      'cy' : '0',
      'fill' : '#000'
    })
    add.circle(diameter).attr({
      'cx' : '0',
      'cy' : defs_height/2,
      'fill' : '#000'
    })
    add.circle(diameter).attr({
      'cx' : defs_width,
      'cy' : defs_height/2,
      'fill' : '#000'
    })
    add.circle(1.5*SVG_RATIO).attr({
      'cx' : defs_width/2,
      'cy' : defs_height,
      'fill' : '#000'
    })
  })
  polkadot_pattern.attr({
    'id' : 'polkadot-texture'
  }).addClass('pattern')

  //水玉模様（背景青色）
  let polkadot_water_pattern = draw.pattern(defs_width, defs_height, function(add) {
    add.rect(defs_width , defs_height).attr({
      'fill' : '#1E90FF'
    })
    add.circle(diameter).attr({
      'cx' : defs_width/2,
      'cy' : '0',
      'fill' : '#000'
    })
    add.circle(diameter).attr({
      'cx' : '0',
      'cy' : defs_height/2,
      'fill' : '#000'
    })
    add.circle(diameter).attr({
      'cx' : defs_width,
      'cy' : defs_height/2,
      'fill' : '#000'
    })
    add.circle(diameter).attr({
      'cx' : defs_width/2,
      'cy' : defs_height,
      'fill' : '#000'
    })
  })
  polkadot_water_pattern.attr({
    'id' : 'polkadot_water-texture'
  }).addClass('pattern')

}

/***************************************
//直線パラメータを取得
****************************************/
function getLineParam(x1,y1,x2,y2) {
  let line_a = -y2 + y1; //直線パラメータのa,b,c
  let line_b = x2 - x1;
  let line_c = -line_a * x1 - line_b * y1;

  let line_param = new Object();
  line_param.a = line_a;
  line_param.b = line_b;
  line_param.c = line_c;
  return line_param;
}

/***********************************
//relative_select
***********************************/
function get_relativeXY(x1,y1,x2,y2,threshold)  {
  let max_x = Math.max(x1, x2) , max_y = Math.max(y1, y2);
  let min_x = Math.min(x1, x2) , min_y = Math.min(y1, y2);
  let relativeXY = new Object();
  relativeXY.max_x = max_x + threshold;
  relativeXY.min_x = min_x - threshold;
  relativeXY.max_y = max_y + threshold;
  relativeXY.min_y = min_y - threshold;
  return relativeXY;
}

//sleep関数：引数[ms]待つ
function js_sleep(waitMsec) {
  let startMsec = new Date();
  // 指定ミリ秒間、空ループ。CPUは常にビジー。
  while (new Date() - startMsec < waitMsec);
}

function resize_application_area(){
  let window_width = $(window).width() , window_height = $(window).height();
  let width_Margin = ($(window).width() - 1550)/2;
  let height_Margin = ($(window).height() - 805)/2;
  if(width_Margin > 0 && height_Margin > 0){
    $('.application_area').css( "margin" , height_Margin + 'px ' + width_Margin + 'px');
  }
}
