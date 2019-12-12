function editpath(){
  update_Segment_Node();
  //セグメントのイベント登録
  segments_ClickEventSet();
  //ノードのイベント登録
  nodes_ClickEventSet();
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
    editpath_mousemove('connect');
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
  draw.select('.segmented').off('mouseover').off('mouseout');
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
    draw.select('.segmented:not(.editing_target)').mouseover(function() {
      this.attr({
        'stroke' : PATH_EDIT_COLOR,
        'cursor':'pointer'
      });
    })
    draw.select('.segmented:not(.editing_target)').mouseout(function() {
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
  if(!input_key_buffer[16]) toConnect();
  get_node_connectRect();
  //クリックした普通の線をセグメント化する
  toSegment(this);
  //idのふりなおし
  update_Segment_Node();
  //セグメントのイベント登録
  segments_ClickEventSet();
  //ノードのイベント登録
  nodes_ClickEventSet();
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
  let Segment_num = getMax_Segments_Group_Number();//セグメントグループの識別番号を取得し、＋１した数を識別番号として使う
  let Segments_Group = draw.group().addClass('Segments_Group');//セグメント化した線を格納するグループ ⇒　グループの中の線で１つの線を形成
  let Nodes_Group = draw.group().addClass('Nodes_Group');//ノードをまとめたグループを作成
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
  let d = path.clear().array().settle();
  //pathのd属性の最後がZ ⇒ つまり閉じている線の場合はグループにclosed_pathクラスを追加
  if(d[d.length-1][0]==="Z"){
    Segments_Group.addClass('closed_path');
    Nodes_Group.addClass('closed_path');
  }
  path.after(Segments_Group);//元の線の次の位置にセグメントグループを配置
  //以下のforループからセグメントとノードを作成していく
  for(let j = 0; j < d.length - 1; j++){
    let segment = Segments_Group.path().addClass('segmented').addClass('path');//セグメントを作成
    let node = Nodes_Group.rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('edit_rect').front();//ノードを作成
    //セグメントの属性を指定
    segment.attr({
      'fill' : 'none', 'stroke' : path.attr('stroke'),
      'stroke-width': path.attr('stroke-width'),
      'stroke-dasharray' : path.attr('stroke-dasharray'),
      'stroke-linejoin': path.attr('stroke-linejoin')
    })
    //線の幅が0mmの場合（塗りつぶされてる場合は線の幅が0mmになっている場合がある）
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
    //線が閉じている場合
    if(d[j+1][0]==="Z"){
      segment.M({x: d[j][1], y: d[j][2]}).L({x: d[0][1], y: d[0][2]});
    }else{ //線が閉じていない場合
      segment.M({x: d[j][1], y: d[j][2]}).L({x: d[j+1][1], y: d[j+1][2]});
      if(j === d.length -2){
        let node = Nodes_Group.rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom()));
        node.addClass('edit_rect').front();
        node.attr({
          'x' : d[j + 1][1] - node.width()/2,
          'y' : d[j + 1][2] - node.height()/2,
          'fill': EDIT_RECT_COLOR
        })
      }
    }
  }
  /**
  塗りつぶしをしている場合にセグメントやノードを動かした場合に
  塗りつぶしの模様も一緒に動くようにするためにfill_pathを作成
  **/
  let fill_path = draw.path().attr({
    'id' : 'fill_path_' + String(Segment_num + 1),
    'fill' : path.attr('fill'),
    'Segments_Group_Number' : String(Segment_num + 1),
    'class' : 'fill_path'
  });
  Segments_Group.before(fill_path);
  update_Segment_Node(); //セグメントやノードにid、クラスなどの名前を振り分ける
  update_fill_path(); //fill_pathの各種設定
  checkEditPath_gadget();
}

/********************************************
//セグメントとノードのidやクラスなどの更新
*********************************************/
function update_Segment_Node(){
  draw.select('.Segments_Group').each(function(i , children){ //セグメントグループで中身が何もないものを削除する
    if(this.children().length === 0){
      let Segments_Group_Number = this.attr('Segments_Group_Number');
      //ノードやfill_pathも対応するものは削除
      SVG.get('#Nodes_Group_' + String(Segments_Group_Number)).remove();
      if(SVG.get('#fill_path_' + String(Segments_Group_Number))) SVG.get('#fill_path_' + String(Segments_Group_Number)).remove();
      this.remove();
    }
  })
  //先頭や最後尾のセグメントであることを示すクラスを削除
  draw.select('.first_Segment').removeClass('first_Segment');
  draw.select('.last_Segment').removeClass('last_Segment');
  //全てのセグメントグループを取得し、逐次的に１つずつ処理
  draw.select('.Segments_Group').each(function(i , children){
    let self = this;
    let Segments_Group_Number = this.attr('Segments_Group_Number');
    this.each(function(j , children){//セグメントグループ内の属性を編集
      this.attr({
        'id' : 'segment_' + String(Segments_Group_Number) + '_' + String(j),
        'assignment_Number': String(j)
      })
      //先頭と最後尾のセグメントに特有のクラスを追加
      if(j===0) this.addClass('first_Segment');
      if(j===self.children().length - 1) this.addClass('last_Segment');
    })
  })
  //先頭と最後尾のノードであることを示すクラスを削除
  draw.select('.init_node').removeClass('init_node');
  draw.select('.last_node').removeClass('last_node');
  draw.select('.Nodes_Group').each(function(i , children){//全てのノードグループを取得し、逐次的に１つずつ処理
    let self = this;
    let Segments_Group_Number = this.attr('Segments_Group_Number');
    this.each(function(j , children){
      this.attr({
        'id' : 'node_' + String(Segments_Group_Number) + '_' + String(j),
        'assignment_Number': String(j),
      })
      //最初と最後のノードに特有のクラスを追加
      if(j===0) this.addClass('init_node');
      if(j===self.children().length - 1) this.addClass('last_node');
    })
  })
}

/*****************************************
 セグメントのマウスクリック時のイベント登録
****************************************/
function segments_ClickEventSet(){
  //ダブルクリック判定用の変数定義
  let clickCount = 0;
  //マウスでクリックしたときにイベントを登録する
  draw.select('.segmented').off('mousedown').on('mousedown',function(e){
    if(e.button===0){//左クリック時
      editpath_hover(false);
      //shiftキー（keycode:16）を押していない　かつ　クリックしたセグメントが選択状態でない場合はリセット
      if(!input_key_buffer[16] && !this.hasClass('editing_target')) reset_editing_target();
      this.attr({ 'stroke' : PATH_EDIT_COLOR}).addClass('editing_target');
      // シングルクリックの場合
      if( !clickCount) {
        move_Segment_Node();
        ++clickCount;
        setTimeout( function() {
          clickCount = 0;
        }, 350 ) ;
      }else{
        /**
         ダブルクリックの場合
         クリックしたセグメントにノードを追加する。
         イメージとしてはセグメントを２本追加し、その中間にノードを配置し、最後に元の線を削除する感じ
        **/
        let d = this.clear().array().settle();
        let assignment_Number = this.attr('assignment_Number');
        //新しく追加する２本のセグメントとノードを作成
        let segmentedPath1 = draw.path().M({x: d[0][1], y: d[0][2]}).L({x: mx, y: my }).addClass('segmented').addClass('path');
        let segmentedPath2 = draw.path().M({x: mx, y: my}).L({x: d[1][1], y: d[1][2] }).addClass('segmented').addClass('path');
        let rect = SVG.get('#Nodes_Group_' + String(this.parent().attr('Segments_Group_Number'))).rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('edit_rect')
        segmentedPath1.attr({
          'fill' : 'none', 'stroke' : this.parent().attr('stroke_tmp'),
          'stroke-width': this.attr('stroke-width'),
          'stroke-dasharray': this.attr('stroke-dasharray'),
          'stroke-linejoin': this.attr('stroke-linejoin')
        })
        segmentedPath2.attr({
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
        this.after(segmentedPath2).after(segmentedPath1);
        rect.back();
        for(let i=0; i < Number(assignment_Number) + 1; i++) rect.forward();
        this.remove();//元のセグメントを削除
        update_Segment_Node();
        segments_ClickEventSet();
        nodes_ClickEventSet();
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
function nodes_ClickEventSet(){
  let clickCount = 0;
  draw.select('.edit_rect').off('mousedown').on('mousedown',function(e){
    editpath_hover(false);
    if(!input_key_buffer[16] && !this.hasClass('editing_target') && event.button===0)  reset_editing_target();
    if(e.button===0){
      this.attr({ 'fill' : EDIT_HOVER_COLOR}).addClass('editing_target');
      // シングルクリックの場合
      if( !clickCount ) {
        move_Segment_Node();
        get_node_connectRect();
        ++clickCount ;
        setTimeout( function() {
          clickCount = 0;
        }, 350 ) ;
      //ダブルクリックの場合はそのノードを削除
      }else{
        delete_editpath_rect(this);
        update_Segment_Node();
        segments_ClickEventSet();
        nodes_ClickEventSet();
        update_fill_path();
        editpath_hover(true); //hoverイベントの再更新
        checkEditPath_gadget();
        clickCount = 0;
      }
    }
  })
}

/****************************************
//選択中のセグメントまたはノードを移動させる関数
********************************************/
function move_Segment_Node(){
  let init_mx = mx, init_my = my; //クリックし始めの座標
  //ctrlキーを押していた場合は90度間隔で移動できるようにする
  if(input_key_buffer[17]) editpath_mousemove('90degree',init_mx,init_my);
  movingFlag = true;
  arrIntervalCnt.push($interval_move = setInterval(function(e){//インターバル関数を起動　インターバル関数の詳しいことはググってみて
        draw.select('.editing_target').each(function(i,children){
          if(this.hasClass('edit_rect')){ //移動の対象がノードの場合
            //描画領域上でのマウス位置などを計算して平行移動させる
            //おそらくよくわからないだろうから、あまり考えない方がいい
            let original_cx = this.attr('x') + this.width()/2, original_cy = this.attr('y') + this.height()/2;
            let cx = original_cx + mx - init_mx , cy = original_cy + my - init_my;
            this.attr({'x':cx - this.width()/2}) , this.attr({'y':cy - this.height()/2});
            //nears
            let nears = get_nears(this);
            if(nears.beforeSegment){
              let d = nears.beforeSegment.clear().array().settle(); //pathのd配列を取得
              nears.beforeSegment.attr({'d':''}).M({x: d[0][1], y: d[0][2]}).L({x: cx, y: cy});
            }
            if(nears.afterSegment){
              let d = nears.afterSegment.clear().array().settle(); //pathのd配列を取得
              nears.afterSegment.attr({'d':''}).M({x: cx, y: cy}).L({x: d[1][1], y: d[1][2]});
            }
          }else{//移動の対象がセグメントの場合
            let d = this.clear().array().settle();
            let original_x1 = d[0][1] , original_y1 = d[0][2];
            let original_x2 = d[1][1] , original_y2 = d[1][2];
            let x1 = original_x1 - init_mx + mx , y1 = original_y1 - init_my + my;
            let x2 = original_x2 - init_mx + mx , y2 = original_y2 - init_my + my;
            this.attr({'d':''}).M({x: x1, y: y1}).L({x: x2, y: y2});
            let nears = get_nears(this);
            if(nears.beforeNode) nears.beforeNode.attr({'x':x1 - nears.beforeNode.width()/2,'y':y1 - nears.beforeNode.height()/2});
            if(nears.afterNode) nears.afterNode.attr({'x':x2 - nears.afterNode.width()/2,'y':y2 - nears.afterNode.height()/2});
            if(nears.beforeSegment){
              let d = nears.beforeSegment.clear().array().settle();
              nears.beforeSegment.attr({'d':''}).M({x: d[0][1], y: d[0][2]}).L({x: x1, y: y1});
            }
            if(nears.afterSegment){
              let d = nears.afterSegment.clear().array().settle();
              nears.afterSegment.attr({'d':''}).M({x: x2, y: y2}).L({x: d[1][1], y: d[1][2]});
            }
          }
        })
        update_fill_path();
        init_mx = mx , init_my = my;
      }, //インターバルする関数の中身終了
    20) //時間周期
  )
}

/******************************
セグメントとノードを全削除する関数
*******************************/
function delete_editpath(){
  let delete_flag = false;
  while(draw.select('.editing_target').first()){
    let editing_target = draw.select('.editing_target').first();
    if(editing_target.hasClass('edit_rect')){
      delete_editpath_rect(editing_target);
    }else{
      delete_editpath_segmentedPath(editing_target);
    }
    update_Segment_Node();
    delete_flag = true;
  }
  segments_ClickEventSet();
  nodes_ClickEventSet();
  update_fill_path();
  editpath_hover(true); //hoverイベントの再更新
  checkEditPath_gadget();
  if(delete_flag) cash_svg();
}

/*************************************
ノードの削除用関数
変数：node に対象のノードが格納されている
*************************************/
function delete_editpath_rect(node){
  let nears = get_nears(node);
  let new_segmentedPath;
  if(nears.afterSegment)afterSegment_d =  nears.afterSegment.clear().array().settle(); //afterSegmentのd配列を取得
  if(nears.beforeSegment)beforeSegment_d =  nears.beforeSegment.clear().array().settle(); //beforeSegmentのd配列を取得
  if(nears.afterSegment && nears.beforeSegment){
    new_segmentedPath = draw.path().M({x: beforeSegment_d[0][1], y: beforeSegment_d[0][2]}).L({x: afterSegment_d[1][1], y: afterSegment_d[1][2]});
    new_segmentedPath.addClass('segmented').addClass('path');
    new_segmentedPath.attr({
      'fill' : 'none','stroke' : nears.beforeSegment.parent().attr('stroke_tmp'),
      'stroke-width': nears.beforeSegment.attr('stroke-width'),
      'stroke-dasharray': nears.beforeSegment.attr('stroke-dasharray'),
      'stroke-linejoin': nears.beforeSegment.attr('stroke-linejoin')
    })
    nears.beforeSegment.after(new_segmentedPath);
  }
  if(nears.beforeSegment!==null)nears.beforeSegment.remove(); //beforeSegmentの削除
  if(nears.afterSegment!==null)nears.afterSegment.remove();  //afterSegmentの削除
  let Segments_Group = SVG.get('Segments_Group_' + String(node.parent().attr('Segments_Group_Number')));
  if(Segments_Group.children().length < 2){ //線が閉じていて、グループ内に線が2本以下の場合
    if(Segments_Group.hasClass('closed_path')){
      Segments_Group.removeClass('closed_path');
      node.parent().removeClass('closed_path');
      new_segmentedPath.remove();
    }
  }
  node.remove();
}

/*********************
セグメントの削除用関数
*********************/
function delete_editpath_segmentedPath(segment){
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
    let fill_path = draw.path().attr({
      'id' : 'fill_path_' + String(max_Segments_Group_Number + 1),
      'fill' : segment.parent().attr('fill_tmp'),
      'Segments_Group_Number' : String(max_Segments_Group_Number + 1),
      'class' : 'fill_path'
    });
    new_Segments_Group.before(fill_path);
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
    let new_path = draw.path().addClass('segmented').addClass('path');
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
    update_Segment_Node();
    nodes_ClickEventSet();
    segments_ClickEventSet();
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
  return ob;
}

/*****************************************************************
//引数に指定したセグメントやノードの前後のセグメントやノードを返す関数
*****************************************************************/
function get_nears(element , dbclick){
  let Segments_Group_Number = Number(element.parent().attr('Segments_Group_Number'));
  let assignment_Number = Number(element.attr('assignment_Number'));
  let ob = new Object();
  //ノードの場合
  if(element.hasClass('edit_rect')){
    //セグメントの順番で言えば、次にある線
    ob.beforeSegment = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(assignment_Number - 1));
    //セグメントの順番で言えば、前にある線
    ob.afterSegment = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(assignment_Number));
    //線が閉じている　かつ　ノードが先頭の場合の処理
    if(element.parent().hasClass('closed_path') && element.hasClass('init_node')){
      SVG.get('#Segments_Group_' + String(Segments_Group_Number)).each(function(i,children){
        if(this.hasClass('last_Segment') && !this.hasClass('first_Segment'))ob.beforeSegment = this;
      })
    }
  //セグメントの場合
  }else{
    //セグメントの順番で言えば、前にあるノード
    ob.beforeNode = SVG.get('node_' + String(Segments_Group_Number) + '_' + String(assignment_Number));
    //セグメントの順番で言えば、次にあるノード
    ob.afterNode = SVG.get('node_' + String(Segments_Group_Number) + '_' + String(assignment_Number + 1));
    //セグメントの順番で言えば、前にあるセグメント
    ob.beforeSegment = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(assignment_Number - 1));
    //セグメントの順番で言えば、次にあるセグメント
    ob.afterSegment = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(assignment_Number + 1));
    //線が閉じている場合の処理
    if(element.parent().hasClass('closed_path')){
      if(element.hasClass('last_Segment')){
        ob.afterNode = SVG.get('node_' + String(Segments_Group_Number) + '_' + String(0)); //進行方向で円の後にある円
        ob.afterSegment = SVG.get('segment_' + String(Segments_Group_Number) + '_' + String(0));
      }else if(element.hasClass('first_Segment')){
        SVG.get('Segments_Group_' + String(Segments_Group_Number)).each(function(i,children){
          if(this.hasClass('last_Segment'))ob.beforeSegment = this;
        })
      }
    }
  }
  /**
  if(!dbclick){
    if(ob.beforeNode){
      if(ob.beforeNode.hasClass('editing_target')) ob.beforeNode = null;
    }
    if(ob.afterNode){
      if(ob.afterNode.hasClass('editing_target')) ob.afterNode = null;
    }
    if(ob.beforeSegment){
      if(ob.beforeSegment.hasClass('editing_target')) ob.beforeSegment = null;
    }
    if(ob.afterSegment){
      if(ob.afterSegment.hasClass('editing_target')) ob.afterSegment = null;
    }
  }
  **/
  return ob;
}

/****************************************************
//レイヤー変更ボタン、塗りつぶしボタンを表示するべきか判定
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
//fill_pathのd属性を更新する関数
*****************************************/
function update_fill_path(){
  draw.select('.fill_path').each(function(i , children){
    let fill_path = this;
    fill_path.attr({'d' : ''});
    let Segments_Group_Number = fill_path.attr('Segments_Group_Number');
    let Segments_Group = SVG.get('#Segments_Group_' + Segments_Group_Number);
    Segments_Group.each(function(i , children){
      let d = this.clear().array().settle() //pathのd配列を取得
      if(i===0){
        fill_path.M({x: d[0][1], y: d[0][2]}).L({x: d[1][1], y: d[1][2]})
      }else{
        fill_path.L({x: d[0][1], y: d[0][2]}).L({x: d[1][1], y: d[1][2]})
      }
    })
    fill_path.Z();
  })
}

/******************************
******************************/
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

/**********************************
現在存在するセグメントグループナンバーの
最大値を返却する関数
**********************************/
function getMax_Segments_Group_Number(){
  let max_Segments_Group_Number = -1;
  draw.select('.Segments_Group').each(function(i, children) {
    if(max_Segments_Group_Number < this.attr('Segments_Group_Number')) max_Segments_Group_Number = this.attr('Segments_Group_Number');
  })
  return max_Segments_Group_Number;
}
