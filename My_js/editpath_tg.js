function editpath(){
  update_editElement();
  //セグメントのイベント登録
  segments_EventSet();
  //ノードのイベント登録
  nodes_EventSet();
  //線の詳細編集用のマウス位置取得関数
  editpath_mousemove('connect');
  //マウスでホバー（mouseover mouseout）したときの処理
  editpath_hover(true);
  checkEditPath_gadget();
  //マウスを離したときの処理
  //⇒平行移動を終了する場合の処理
  $(document).off('mouseup').on('mouseup',function(){
    while(arrIntervalCnt.length !== 0) {  clearInterval(arrIntervalCnt.shift())  }
    if(movingFlag) cash_svg();
    movingFlag = false;
    editpath_hover(true);
    editpath_mousemove('normal');
  })
  //右クリックメニューの表示非表示
  set_contextMenu();
}
/**********************************
線の詳細編集専用のマウスの座標取得関数
***********************************/
function editpath_mousemove(mode,param1,param2){
  switch(mode){
    case 'connect':
      draw.off('mousemove').mousemove(function(e){
        mx = getmousepoint('connect',e).x ,  my = getmousepoint('connect',e).y;
      });
      break;
    case '90degree':
      draw.off('mousemove').mousemove(function(e){
        mx = getmousepoint('90degree',e,param1,param2).x , my = getmousepoint('90degree',e,param1,param2).y;
      });
      break;
    default:
      draw.off('mousemove').mousemove(function(e){
        mx = getmousepoint('normal',e).x , my = getmousepoint('normal',e).y; //描画領域上でのマウスポイント計算
      });
      break;
  }
}
/******************************************************
 マウスでhoverしたときのイベントを登録する関数
 mouseover（触れたとき） ＆　mouseout（離れたとき）
******************************************************/
function editpath_hover(flag){
  //mouseover & mouseoutイベントの全解除
  draw.select('.connected').off('mouseover').off('mouseout');
  draw.select('.fragmented').off('mouseover').off('mouseout');
  draw.select('.path_edit_frag').off('mouseover').off('mouseout');
  draw.select('.edit_rect').off('mouseover').off('mouseout');
  //イベントの登録
  if(flag){
    //普通の線のイベント登録
    //マウスでふれたときはマウスカーソルを変化させる
    draw.select('.connected').mouseover(function() {
      this.attr({
        'cursor' : 'pointer'
      });
      //マウスで普通の線に触れているときにクリックした場合は、その線をセグメント化する
      this.off('mousedown',editpath_mousedown).mousedown(editpath_mousedown);
    })
    draw.select('.connected').mouseout(function() {
      this.attr({
        'cursor':'default'
      });
      //マウスを離したときはクリックイベントを解除する
      this.off('mousedown',editpath_mousedown);
    })
    //セグメントのイベント登録
    //マウスでふれたときは色とマウスカーソルを変化させる
    //注意：選択中（多分青色になってる）のセグメントはマウスでふれても色を変えないし、カーソルも変えない
    draw.select('.fragmented:not(.editing_target)').mouseover(function() {
      this.attr({
        'stroke' : PATH_EDIT_COLOR,
        'cursor':'pointer'
      });
    })
    draw.select('.fragmented:not(.editing_target)').mouseout(function() {
      this.attr({
        'stroke': this.parent().attr('stroke_tmp'),
        'cursor':'default'
      });
    })
    //ノードのイベント登録
    //注意：選択中（多分青色になってる）のノードはマウスでふれても色を変えないし、カーソルも変えない
    draw.select('.edit_rect:not(.editing_target)').mouseover(function() {
      this.attr({
        'fill': EDIT_HOVER_COLOR,
        'cursor':'pointer'
      });
    })
    draw.select('.edit_rect:not(.editing_target)').mouseout(function() {
      this.attr({
        'fill': EDIT_RECT_COLOR,
        'cursor':'default'
      })
    })
  }
}

/***********************************
普通の線をクリックした時に起動する関数
************************************/
function editpath_mousedown(){
  //shiftキーを押していない場合：全てのセグメントを普通の線に戻す
  if(!input_key_buffer[16]) toConnected();
  get_node_connectRect();
  //クリックした普通の線をセグメント化する
  toSegment(this);
  //idのふりなおし
  update_editElement();
  //セグメントのイベント登録
  segments_EventSet();
  //ノードのイベント登録
  nodes_EventSet();
  //hoverイベントの再更新
  editpath_hover(true);
  //クリックした線は削除
  this.remove();
}

/**
普通の線をセグメント化する関数
引数のpathはセグメント化の対象とする線のこと
**/
function toSegment(path){
  //現在セグメント化されている線の数を取得する⇒識別番号に使う
  let Segment_num = getMax_Segments_Group_Number();
  let d = path.clear().array().settle();
  //セグメント化した線を格納するグループ
  //要はグループの１つ１つが元の線であるってこと
  let Segments_Group = draw.group().addClass('Segments_Group');
  //こっちは線ごとにノードをまとめたグループ
  let Nodes_Group = draw.group().addClass('Nodes_Group');
  Segments_Group.attr({
    'id' : 'Segments_Group_' + String(Segment_num + 1),
    'Segments_Group_Number' : String(Segment_num + 1),
    'connected_id' : path.attr('id'),
    'fill_tmp': path.attr('fill') , 'stroke_tmp': path.attr('stroke')
  })
  Nodes_Group.attr({
    'id' : 'Nodes_Group_' + String(Segment_num + 1),
    'Segments_Group_Number' : String(Segment_num + 1)
  })
  //pathのd属性がZでおわる⇒つまり閉じている線の場合はグループにclosed_pathクラスを追加しておく
  if(d[d.length-1][0]==="Z"){
    Segments_Group.addClass('closed_path');
    Nodes_Group.addClass('closed_path');
  }
  //元の線の次の位置にグループを置く
  path.after(Segments_Group);
  //次のforループからセグメントとノードを作成していく
  for(let j = 0; j < d.length - 1; j++){
    //セグメントを作成
    let segment = Segments_Group.path().addClass('fragmented').addClass('SVG_Element').addClass('path');
    //ノードを作成
    let node = Nodes_Group.rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('edit_rect').front();
    //セグメントの属性を指定
    segment.attr({
      'fill' : 'none', 'stroke' : path.attr('stroke'),
      'stroke-width': path.attr('stroke-width'),
      'stroke-dasharray' : path.attr('stroke-dasharray'),
      'stroke-linejoin': path.attr('stroke-linejoin')
    })
    //線の幅が0mmの場合（おそらく塗りつぶされてる場合とかは線の幅を0mmにする可能性がある）
    if(segment.attr('stroke-width') === 0){
      segment.attr({
        'stroke-width': PS_WIDTH,
        'stroke-dasharray' : 4*PS_WIDTH + ' ' + PS_WIDTH,
        'Non_stroke' : 'true'
      })
    }
    //ノードの属性を指定
    node.attr({
      'x' : d[j][1] - node.width()/2,
      'y' : d[j][2] - node.height()/2,
      'fill': EDIT_RECT_COLOR
    })
    //先頭のセグメントとノードには特有のクラスを追加しておく
    if(j === 0){
      segment.addClass('first_Segment');
      node.addClass('init_node');
    }
    //最後尾のセグメントとノードにも特有のクラスを追加しておく
    if(j===d.length - 2) segment.addClass('last_Segment');
    //次の要素がZ要素である場合
    if(d[j+1][0]==="Z"){
      segment.M({x: d[j][1], y: d[j][2]}).L({x: d[0][1], y: d[0][2]});
    //次の要素がZ要素でない場合
    }else{
      segment.M({x: d[j][1], y: d[j][2]}).L({x: d[j+1][1], y: d[j+1][2]});
      if(j === d.length -2){
        let node = Nodes_Group.rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('edit_rect').addClass('last_node').front(); ////重ね順を一番前に
        node.attr({
          'x' : d[j + 1][1] - node.width()/2,
          'y' : d[j + 1][2] - node.height()/2,
          'fill': EDIT_RECT_COLOR
        })
      }
    }
  }
  /**
  ゴーストパスの設定
  命名理由は特になし。塗りつぶしをしている場合にセグメントやノードを動かした場合に
  塗りつぶしの模様も一緒に動くようにするために作成
  **/
  let ghost_path = draw.path().attr({
    'id' : 'ghost_path_' + String(Segment_num + 1),
    'fill' : path.attr('fill'),
    'Segments_Group_Number' : String(Segment_num + 1),
    'class' : 'ghost_path'
  });
  Segments_Group.before(ghost_path);
  update_ghostPath();
  checkEditPath_gadget();
}

/********************************************
//セグメントとノードのidやクラスなどの更新
*********************************************/
function update_editElement(){
  //まずセグメントグループで中身が何もないものを削除する
  draw.select('.Segments_Group').each(function(i , children){
    if(this.children().length === 0){
      let Segments_Group_Number = this.attr('Segments_Group_Number');
      //ノードやゴーストパスも対応するものは削除しておく
      SVG.get('#Nodes_Group_' + String(Segments_Group_Number)).remove();
      if(SVG.get('#ghost_path_' + String(Segments_Group_Number))) SVG.get('#ghost_path_' + String(Segments_Group_Number)).remove();
      this.remove();
    }
  })
  //先頭や最後尾のセグメントは削除
  draw.select('.first_Segment').removeClass('first_Segment');
  draw.select('.last_Segment').removeClass('last_Segment');
  //全てのセグメントグループを取得し、逐次的に１つずつ処理
  draw.select('.Segments_Group').each(function(i , children){
    let Segments_Group_Number = this.attr('Segments_Group_Number');
    let self = this;
    //セグメントグループ内の属性を編集していく
    this.each(function(j , children){
      this.attr({
        'id' : 'segment_' + String(Segments_Group_Number) + '_' + String(j),
        'assignment_Number': String(j),
      })
      //先頭と最後尾のセグメントには特有の属性を追加する
      if(j===0) this.addClass('first_Segment');
      if(j===self.children().length - 1) this.addClass('last_Segment');
    })
  })
  //先頭と最後尾のノードのクラスを削除する
  draw.select('.init_node').removeClass('init_node');
  draw.select('.last_node').removeClass('last_node');
  //全てのノードグループを取得し、逐次的に１つずつ処理
  draw.select('.Nodes_Group').each(function(i , children){
    let Segments_Group_Number = this.attr('Segments_Group_Number');
    let self = this;
    this.each(function(j , children){
      this.attr({
        'id' : 'node_' + String(Segments_Group_Number) + '_' + String(j),
        'assignment_Number': String(j),
      })
      //最初と最後のノードには特有のクラスを追加
      if(j===0) this.addClass('init_node');
      if(j===self.children().length - 1) this.addClass('last_node');
    })
  })
}

/*****************************************
 セグメントのイベントの登録
****************************************/
function segments_EventSet(){
  //ダブルクリック判定用の変数定義
  let clickCount = 0;
  //マウスでクリックしたときにイベントを登録する
  draw.select('.fragmented').off('mousedown').on('mousedown',function(e){
    editpath_hover(false);
    //shiftキー（keycode:16）を押していない　かつ　現在クリックしたセグメントが選択状態でない　かつ　左クリック
    if(!input_key_buffer[16] && !this.hasClass('editing_target') && event.button===0) reset_editing_target();
    this.attr({ 'stroke' : PATH_EDIT_COLOR}).addClass('editing_target');
    //左クリック時
    if(e.button===0){
      // シングルクリックの場合
      if( !clickCount) {
        move_editing();
        ++clickCount;
        setTimeout( function() {
          clickCount = 0;
        }, 350 ) ;
      /**
       ダブルクリックの場合
       クリックしたセグメントにノードを追加する。
       イメージとしてはセグメントを２本追加し、その中間にノードを配置し、最後に元の線を削除する感じ
      **/
      }else{
        let d = this.clear().array().settle();
        let assignment_Number = this.attr('assignment_Number');
        //新しく追加する２本のセグメントとノード
        let fragmentedPath1 = draw.path().M({x: d[0][1], y: d[0][2]}).L({x: mx, y: my }).addClass('fragmented').addClass('SVG_Element').addClass('path');
        let fragmentedPath2 = draw.path().M({x: mx, y: my}).L({x: d[1][1], y: d[1][2] }).addClass('fragmented').addClass('SVG_Element').addClass('path');
        let rect = SVG.get('#Nodes_Group_' + String(this.parent().attr('Segments_Group_Number'))).rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('edit_rect').back();
        fragmentedPath1.attr({
          'fill' : 'none', 'stroke' : this.parent().attr('stroke_tmp'),
          'stroke-width': this.attr('stroke-width'),
          'stroke-dasharray': this.attr('stroke-dasharray'),
          'stroke-linejoin': this.attr('stroke-linejoin')
        })
        fragmentedPath2.attr({
          'fill' : 'none', 'stroke' : this.parent().attr('stroke_tmp'),
          'stroke-width': this.attr('stroke-width'),
          'stroke-dasharray': this.attr('stroke-dasharray'),
          'stroke-linejoin': this.attr('stroke-linejoin')
        })
        rect.attr({
          'x' : mx - rect.width()/2,
          'y' : my - rect.height()/2,
          'fill': EDIT_RECT_COLOR
        })
        this.after(fragmentedPath2).after(fragmentedPath1);
        for(let i=0; i < Number(assignment_Number) + 1; i++) rect.forward();
        //元のセグメントを削除
        this.remove();
        update_editElement();
        segments_EventSet();
        nodes_EventSet();
        editpath_hover(true);
        cash_svg();
        clickCount = 0;
      }
    }
  })
}

/****************************************
//ノードのイベント登録
セグメントのイベント登録と重複する箇所が多い
*****************************************/
function nodes_EventSet(){
  let clickCount = 0;
  draw.select('.edit_rect').off('mousedown').on('mousedown',function(e){
    editpath_hover(false);
    if(!input_key_buffer[16] && !this.hasClass('editing_target') && event.button===0)  reset_editing_target();
    if(e.button===0){
      this.attr({ 'fill' : EDIT_HOVER_COLOR}).addClass('editing_target');
      // シングルクリックの場合
      if( !clickCount ) {
        move_editing();
        get_node_connectRect();
        ++clickCount ;
        setTimeout( function() {
          clickCount = 0;
        }, 350 ) ;
      //ダブルクリックの場合
      //ノードを削除する
      }else{
        delete_editpath_rect(this);
        update_editElement();
        segments_EventSet();
        nodes_EventSet();
        update_ghostPath();
        editpath_hover(true); //hoverイベントの再更新
        checkEditPath_gadget();
        clickCount = 0;
      }
    }
  })
}

/********************************
//セグメントとノードを移動させる関数
*********************************/
function move_editing(){
  //クリックし始めの座標
  let init_x = mx, init_y = my;
  //ctrlキーを押していた場合は90度間隔で移動できるようにする
  if(input_key_buffer[17]) editpath_mousemove('90degree',init_x,init_y);
  movingFlag = true;
  //インターバル関数の起動
  //詳細はググってみてね
  arrIntervalCnt.push($interval_move = setInterval(function(e){
        draw.select('.editing_target').each(function(i,children){
          //移動させるものがノードの場合
          if(this.hasClass('edit_rect')){
            //描画領域上でのマウス位置などを計算して平行移動させる
            //おそらくよくわからないだろうから、あまり考えない方がいい
            let original_cx = this.attr('x') + this.width()/2, original_cy = this.attr('y') + this.height()/2;
            let cx = original_cx + mx - init_x , cy = original_cy + my - init_y;
            this.attr({'x':cx - this.width()/2}) , this.attr({'y':cy - this.height()/2});
            //nears
            let nears = getSimultaneouslyEdit_element(this);
            if(nears.beforePath){
              let d = nears.beforePath.clear().array().settle(); //pathのd配列を取得
              nears.beforePath.attr({'d':''}).M({x: d[0][1], y: d[0][2]}).L({x: cx, y: cy});
            }
            if(nears.afterPath){
              let d = nears.afterPath.clear().array().settle(); //pathのd配列を取得
              nears.afterPath.attr({'d':''}).M({x: cx, y: cy}).L({x: d[1][1], y: d[1][2]});
            }
          //セグメントの場合
          }else{
            let d = this.clear().array().settle();
            let original_x1 = d[0][1] , original_y1 = d[0][2];
            let original_x2 = d[1][1] , original_y2 = d[1][2];
            let x1 = original_x1 - init_x + mx , y1 = original_y1 - init_y + my;
            let x2 = original_x2 - init_x + mx , y2 = original_y2 - init_y + my;
            this.attr({'d':''}).M({x: x1, y: y1}).L({x: x2, y: y2});
            let nears = getSimultaneouslyEdit_element(this);
            if(nears.beforeRect) nears.beforeRect.attr({'x':x1 - nears.beforeRect.width()/2,'y':y1 - nears.beforeRect.height()/2});
            if(nears.afterRect) nears.afterRect.attr({'x':x2 - nears.afterRect.width()/2,'y':y2 - nears.afterRect.height()/2});
            if(nears.beforePath){
              let d = nears.beforePath.clear().array().settle();
              nears.beforePath.attr({'d':''}).M({x: d[0][1], y: d[0][2]}).L({x: x1, y: y1});
            }
            if(nears.afterPath){
              let d = nears.afterPath.clear().array().settle();
              nears.afterPath.attr({'d':''}).M({x: x2, y: y2}).L({x: d[1][1], y: d[1][2]});
            }
          }
        })
        update_ghostPath();
        init_x = mx , init_y = my;
      }, //インターバルする関数の中身終了
    20) //時間周期
  )
}

/******************************
セグメントとノードの削除用制御関数
*******************************/
function delete_editpath(){
  let delete_flag = false;
  while(draw.select('.editing_target').first()){
    let editing_target = draw.select('.editing_target').first();
    if(editing_target.hasClass('edit_rect')){
      delete_editpath_rect(editing_target);
    }else{
      delete_editpath_fragmentedPath(editing_target);
    }
    update_editElement();
    delete_flag = true;
  }
  segments_EventSet();
  nodes_EventSet();
  update_ghostPath();
  editpath_hover(true); //hoverイベントの再更新
  checkEditPath_gadget();
  if(delete_flag) cash_svg();
}

/*************************************
ノードの削除用関数
変数：nodeに対象のノードが格納されている
*************************************/
function delete_editpath_rect(node){
  let nears = getSimultaneouslyEdit_element(node);
  let new_fragmentedPath;
  if(nears.afterPath)afterPath_d =  nears.afterPath.clear().array().settle(); //afterPathのd配列を取得
  if(nears.beforePath)beforePath_d =  nears.beforePath.clear().array().settle(); //beforePathのd配列を取得
  if(nears.afterPath && nears.beforePath){
    new_fragmentedPath = draw.path().M({x: beforePath_d[0][1], y: beforePath_d[0][2]}).L({x: afterPath_d[1][1], y: afterPath_d[1][2]});
    new_fragmentedPath.addClass('fragmented').addClass('SVG_Element').addClass('path');
    new_fragmentedPath.attr({
      'fill' : 'none','stroke' : nears.beforePath.parent().attr('stroke_tmp'),
      'stroke-width': nears.beforePath.attr('stroke-width'),
      'stroke-dasharray': nears.beforePath.attr('stroke-dasharray'),
      'stroke-linejoin': nears.beforePath.attr('stroke-linejoin')
    })
    nears.beforePath.after(new_fragmentedPath);
  }
  if(nears.beforePath!==null)nears.beforePath.remove(); //beforePathの削除
  if(nears.afterPath!==null)nears.afterPath.remove();  //afterPathの削除
  let Segments_Group = SVG.get('Segments_Group_' + String(node.parent().attr('Segments_Group_Number')));
  if(Segments_Group.children().length < 2){ //線が閉じていて、グループ内に線が2本以下の場合
    if(Segments_Group.hasClass('closed_path')){
      Segments_Group.removeClass('closed_path');
      node.parent().removeClass('closed_path');
      new_fragmentedPath.remove();
    }
  }
  node.remove();
}

/*********************
セグメントの削除用関数
*********************/
function delete_editpath_fragmentedPath(segment){
  if(!segment.parent().hasClass('closed_path')){
    let max_Segments_Group_Number = getMax_Segments_Group_Number();
    let new_Segments_Group = draw.group().addClass('Segments_Group');
    let new_Nodes_Group = draw.group().addClass('Nodes_Group');
    let current_Segments_Group_Number = segment.parent().attr('Segments_Group_Number');
    new_Segments_Group.attr({
      'id' : 'Segments_Group_' + String(max_Segments_Group_Number + 1),
      'Segments_Group_Number' : String(max_Segments_Group_Number + 1),
      'connected_id' : segment.parent().attr('connected_id'),
      'fill_tmp': segment.parent().attr('fill_tmp') , 'stroke_tmp' : segment.parent().attr('stroke_tmp')
    })
    let ghost_path = draw.path().attr({
      'id' : 'ghost_path_' + String(max_Segments_Group_Number + 1),
      'fill' : segment.parent().attr('fill_tmp'),
      'Segments_Group_Number' : String(max_Segments_Group_Number + 1),
      'class' : 'ghost_path'
    });
    new_Segments_Group.before(ghost_path);
    new_Nodes_Group.attr({
      'id' : 'Nodes_Group_' + String(max_Segments_Group_Number + 1),
      'Segments_Group_Number' : String(max_Segments_Group_Number + 1),
    })
    segment.parent().before(new_Segments_Group);
    for(let j=0 ; j < Number(segment.attr('assignment_Number')) + 1; j++){
      new_Segments_Group.add(SVG.get('segment_'+ String(current_Segments_Group_Number) + '_'  + String(j)));
      new_Nodes_Group.add(SVG.get('node_'+ String(current_Segments_Group_Number) + '_' + String(j)));
    }
  }else{
    let current_Segments_Group_Number = segment.parent().attr('Segments_Group_Number');
    for(let j=0 ; j < Number(segment.attr('assignment_Number')) + 1; j++){
      SVG.get('segment_'+ String(current_Segments_Group_Number) + '_'  + String(j)).front();
      SVG.get('node_'+ String(current_Segments_Group_Number) + '_'  + String(j)).front();
    }
    segment.parent().removeClass('closed_path');
    let Nodes_Group = SVG.get('Nodes_Group_'+ String(current_Segments_Group_Number));
    if(Nodes_Group) Nodes_Group.removeClass('closed_path');
  }
  segment.remove();
}

/*******************************
 ノードの結合関数
 選択状態の２つのノードを接続する
*******************************/
function node_connect_function(){
  //選択状態のノードを２つ取得する
  let connectRect = get_node_connectRect();
  let rect1 = connectRect.rect1 , rect2 = connectRect.rect2;
  //選択状態のノードが２つ取得できた場合
  //選択状態のノードを２つ取得できなかった場合は何もしない
  if(rect1 && rect2){
    //それぞれのノードに対応するセグメントグループを取得する
    let Segments_Group1 = SVG.get('#Segments_Group_' + rect1.parent().attr('Segments_Group_Number'));
    let Segments_Group2 = SVG.get('#Segments_Group_' + rect2.parent().attr('Segments_Group_Number'));
    //それぞれのノードのグループを取得する
    let Nodes_Group1 = rect1.parent();
    let Nodes_Group2 = rect2.parent();
    let connect_flag1 , connect_flag2;
    //取得したノードにあわせてconnect_flagに値を格納する
    if(rect1.hasClass('init_node')){
      connect_flag1 = 'first';
    }else{
      connect_flag1 = 'last';
    }
    if(rect2.hasClass('init_node')){
      connect_flag2 = 'first';
    }else{
      connect_flag2 = 'last';
    }
    //新しく追加するセグメントを作成
    let new_path = draw.path().addClass('fragmented').addClass('SVG_Element').addClass('path');
    new_path.attr({
      'fill' : 'none','stroke' : Segments_Group1.attr('stroke_tmp'),
      'stroke-width': Segments_Group1.first().attr('stroke-width'),
      'stroke-dasharray': Segments_Group1.first().attr('stroke-dasharray'),
      'stroke-linejoin': Segments_Group1.first().attr('stroke-linejoin')
    })
    //セグメントにあわせて様々な場合分けで処理をする。
    if(Segments_Group1 === Segments_Group2){
      if(rect1.hasClass('first')){
        new_path.M({x: rect1.cx(), y: rect1.cy()}).L({x: rect2.cx(), y: rect2.cy()});
      }else{
        new_path.M({x: rect2.cx(), y: rect2.cy()}).L({x: rect1.cx(), y: rect1.cy()});
      }
      Segments_Group1.add(new_path);
      new_path.front();
      Segments_Group1.addClass('closed_path');
      Nodes_Group1.addClass('closed_path');
    }else{
      if(connect_flag1 === 'first' && connect_flag2 === 'first'){ //先端同士の場合
        new_path.M({x: rect1.cx(), y: rect1.cy()}).L({x: rect2.cx(), y: rect2.cy()});
        Segments_Group2.add(new_path);
        new_path.back();
        Segments_Group1.each(function(j , children){
          var d = this.clear().array().settle();
          this.attr({ 'd' : 'M' + d[1][1] + ' ' + d[1][2] + 'L' + d[0][1] + ' ' + d[0][2] });
          Segments_Group2.add(this);
          this.back();
        })
        Nodes_Group1.each(function(j,children){
          Nodes_Group2.add(this);
          this.back();
        })
      }else if(connect_flag1 === 'first' && connect_flag2 === 'last'){
        new_path.M({x: rect2.cx(), y: rect2.cy()}).L({x: rect1.cx(), y: rect1.cy()});
        Segments_Group2.add(new_path);
        new_path.front();
        Segments_Group1.each(function(j , children){
          Segments_Group2.add(this);
          this.front();
        })
        Nodes_Group1.each(function(j,children){
          Nodes_Group2.add(this);
          this.front();
        })
      }else if(connect_flag1 === 'last' && connect_flag2 === 'first'){
        new_path.M({x: rect1.cx(), y: rect1.cy()}).L({x: rect2.cx(), y: rect2.cy()});
        Segments_Group1.add(new_path);
        new_path.front();
        Segments_Group2.each(function(j , children){
          Segments_Group1.add(this);
          this.front();
        })
        Nodes_Group2.each(function(j,children){
          Nodes_Group1.add(this);
          this.front();
        })
      }else{
        new_path.M({x: rect2.cx(), y: rect2.cy()}).L({x: rect1.cx(), y: rect1.cy()});
        Segments_Group2.add(new_path);
        new_path.front();
        let last_Path2 = Segments_Group2.last();
        let last_node2 = Nodes_Group2.last();
        Segments_Group1.each(function(j , children){
          var d = this.clear().array().settle();
          this.attr({ 'd' : 'M' + d[1][1] + ' ' + d[1][2] + 'L' + d[0][1] + ' ' + d[0][2] });
          last_Path2.after(this);
        })
        Nodes_Group1.each(function(j , children){
          last_node2.after(this);
        })
      }
    }
    update_editElement();
    nodes_EventSet();
    segments_EventSet();
    get_node_connectRect();
    reset_editing_target();
    editpath_hover(true); //hoverイベントの再更新
    cash_svg();
  }
}
/***************************
選択状態のノードを２つ取得する
****************************/
function get_node_connectRect(){
  let edge_node_num = 0;
  let ob = new Object();
  draw.select('.editing_target').each(function(i , children){
    if(this.hasClass('init_node') || this.hasClass('last_node')){
      if(!this.parent().hasClass('closed_path')){
        if(edge_node_num === 0){
          ob.rect1 = this;
          edge_node_num++;
        }else if(edge_node_num === 1){
          if(ob.rect1.parent() !== this.parent()){
            ob.rect2 = this;
            edge_node_num++;
          }else{
            if(this.parent().children().length > 2){
              ob.rect2 = this;
              edge_node_num++;
            }
          }
        }
      }
    }
  })
  if(ob.rect1 && ob.rect2){
    $('#node_connect').css('cursor','pointer');
    $('#node_connect').css('background-color','#E2EDF9');
    $('#node_connect').css('border-color','orange');
    $('#node_connect').hover(function() {
      $(this).css('background', '#31A9EE');
    }, function() {
      $(this).css('background', '#E2EDF9');
    });
    $('#node_connect').prop("disabled", false);
  }else{
    $('#node_connect').css('cursor','default');
    $('#node_connect').css('background-color','#C0C0C0');
    $('#node_connect').css('color','#000000');
    $('#node_connect').css('border-color','#696969');
    $('#node_connect').off('mouseenter mouseleave');
    $('#node_connect').prop("disabled", true);
  }
  return ob;
}

/*****************************************************************
//引数に指定したセグメントやノードの前後のセグメントやノードを返す関数
*****************************************************************/
function getSimultaneouslyEdit_element(element , dbclick){
  let Segments_Group_Number = Number(element.parent().attr('Segments_Group_Number'));
  let assignment_Number = Number(element.attr('assignment_Number'));
  let ob = new Object();
  //ノードの場合
  if(element.hasClass('edit_rect')){
    //セグメントの順番で言えば、次にある線
    ob.beforePath = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(assignment_Number - 1));
    //セグメントの順番で言えば、前にある線
    ob.afterPath = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(assignment_Number));
    //線が閉じている　かつ　ノードが先頭の場合の処理
    if(element.parent().hasClass('closed_path') && element.hasClass('init_node')){
      SVG.get('#Segments_Group_' + String(Segments_Group_Number)).each(function(i,children){
        if(this.hasClass('last_Segment') && !this.hasClass('first_Segment'))ob.beforePath = this;
      })
    }
  //セグメントの場合
  }else{
    //セグメントの順番で言えば、前にあるノード
    ob.beforeRect = SVG.get('node_' + String(Segments_Group_Number) + '_' + String(assignment_Number));
    //セグメントの順番で言えば、次にあるノード
    ob.afterRect = SVG.get('node_' + String(Segments_Group_Number) + '_' + String(assignment_Number + 1));
    //セグメントの順番で言えば、前にあるセグメント
    ob.beforePath = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(assignment_Number - 1));
    //セグメントの順番で言えば、次にあるセグメント
    ob.afterPath = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(assignment_Number + 1));
    //線が閉じている場合の処理
    if(element.parent().hasClass('closed_path')){
      if(element.hasClass('last_Segment')){
        ob.afterRect = SVG.get('node_' + String(Segments_Group_Number) + '_' + String(0)); //進行方向で円の後にある円
        ob.afterPath = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(0));
      }else if(element.hasClass('first_Segment')){
        SVG.get('Segments_Group_' + String(Segments_Group_Number)).each(function(i,children){
          if(this.hasClass('last_Segment'))ob.beforePath = this;
        })
      }
    }
  }
  if(!dbclick){
    if(ob.beforeRect){
      if(ob.beforeRect.hasClass('editing_target')) ob.beforeRect = null;
    }
    if(ob.afterRect){
      if(ob.afterRect.hasClass('editing_target')) ob.afterRect = null;
    }
    if(ob.beforePath){
      if(ob.beforePath.hasClass('editing_target')) ob.beforePath = null;
    }
    if(ob.afterPath){
      if(ob.afterPath.hasClass('editing_target')) ob.afterPath = null;
    }
  }
  return ob;
}

/****************************************
//垂直化
*****************************************/
function verhor_fragmentedPath(){
  draw.select('.editing_target').each(function(i,children){
    if(!this.hasClass('edit_rect')){
      var d = this.clear().array().settle();
      var x1 = d[0][1] , y1 = d[0][2];
      var x2 = d[1][1] , y2 = d[1][2];
      var line_rad = Math.atan( Math.abs(y2 - y1 )/Math.abs(x2 - x1) );
      if(line_rad * 180/Math.PI < 45){
        y2 = y1;
      }else{
        x2 = x1;
      }
      this.attr({'d':''}).M({x: x1, y: y1}).L({x: x2, y: y2});
      var nears = getSimultaneouslyEdit_element(this , true);
      if(nears.beforeRect) nears.beforeRect.attr({ 'x' : x1 - nears.beforeRect.width()/2, 'y' : y1 - nears.beforeRect.height()/2});
      if(nears.afterRect) nears.afterRect.attr({ 'x' : x2 - nears.afterRect.width()/2, 'y' : y2 - nears.afterRect.height()/2});
      if(nears.beforePath){
        var d = nears.beforePath.clear().array().settle(); //pathのd配列を取得
        nears.beforePath.attr({'d':''}).M({x: d[0][1], y: d[0][2]}).L({x: x1, y: y1});
      }
      if(nears.afterPath){
        var d = nears.afterPath.clear().array().settle(); //pathのd配列を取得
        nears.afterPath.attr({'d':''}).M({x: x2, y: y2}).L({x: d[1][1], y: d[1][2]});
      }
      update_ghostPath();
    }
  })
  if(draw.select('.editing_target:not(.edit_rect)').first())cash_svg();
  reset_editing_target();
  editpath_hover(true);
}

/****************************************************
//レイヤー変更ボタン、塗りつぶしボタンを表示すべきか判定
*****************************************************/
function checkEditPath_gadget(){
  $('.stroke_option , .dotted_option').hide();
  $("#radio_solid_path").prop('checked', true);
  $('#table_layer').hide();
  $('#table_select_fill').hide();
  $('#straight_connect_button').hide();
  if(draw.select('.Segments_Group').first()!==undefined){
    $('.stroke_option').show();
    $('#table_layer').show();
    $('#table_select_fill').show();
    $('#straight_connect_button').show();
  }
}

/****************************************
//ghost_pathの更新
*****************************************/
function update_ghostPath(){
  draw.select('.ghost_path').each(function(i , children){
    let ghost_path = this;
    ghost_path.attr({'d' : ''});
    let Segments_Group_Number = ghost_path.attr('Segments_Group_Number');
    let Segments_Group = SVG.get('#Segments_Group_' + Segments_Group_Number);
    Segments_Group.each(function(i , children){
      let d = this.clear().array().settle() //pathのd配列を取得
      if(i===0){
        ghost_path.M({x: d[0][1], y: d[0][2]}).L({x: d[1][1], y: d[1][2]})
      }else{
        ghost_path.L({x: d[0][1], y: d[0][2]}).L({x: d[1][1], y: d[1][2]})
      }
    })
    ghost_path.Z();
  })
}

function reset_editing_target(){
  draw.select('.editing_target').each(function(i,children){
    this.removeClass('editing_target');
    if(this.hasClass('edit_rect')){
      this.attr({ 'fill' : EDIT_RECT_COLOR});
    }else{
      this.attr({ 'stroke' : this.parent().attr('stroke_tmp')});
    }
  })
}

function getMax_Segments_Group_Number(){
  let max_Segments_Group_Number = -1;
  draw.select('.Segments_Group').each(function(i, children) {
    if(max_Segments_Group_Number < this.attr('Segments_Group_Number')) max_Segments_Group_Number = this.attr('Segments_Group_Number');
  })
  return max_Segments_Group_Number;
}
