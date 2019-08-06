function editpath(){
  update_editElement();
  fragmentedPath_EventSet();
  edit_rect_EventSet();

  editpath_mousemove('connect');
  editpath_hover(true);
  $('#node_connect').off('click').click(node_connect_function);

  $(document).off('mouseup').on('mouseup',function(){ //mouseup終了時の処理
    while(arrIntervalCnt.length !== 0) {  clearInterval(arrIntervalCnt.shift())  }
    if(now_movingFlag) cash_svg();
    now_movingFlag = false;
    editpath_hover(true);
    editpath_mousemove('normal');
  })
  set_contextMenu();
  let base_x = 0 , base_y = 0;
}
//マウスを動かしているときの関数
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
//hoverしたときの関数
******************************************************/
function editpath_hover(mode){
  draw.select('.connected').off('mouseover').off('mouseout');
  draw.select('.fragmented').off('mouseover').off('mouseout');
  draw.select('.path_edit_frag').off('mouseover').off('mouseout');
  draw.select('.edit_rect').off('mouseover').off('mouseout');
  if(mode){
    draw.select('.connected').mouseover(function() {
      this.attr({
        'cursor' : 'pointer'
      });
      this.off('mousedown',editpath_mousedown).mousedown(editpath_mousedown);
    })
    draw.select('.connected').mouseout(function() {
      this.attr({
        'cursor':'default'
      });
      this.off('mousedown',editpath_mousedown);
    })
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
    //ノード（edit_rect）のイベントセット
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


//クリック時に起動する関数
function editpath_mousedown(){
  if(!input_key_buffer[16]) toConnected(); //shiftキーを押していない場合：バラバラ状態のpathを全てくっつき状態にする
  get_node_connectRect();
  toFragmented(this); //clickしたpathをバラバラ状態にする
  update_editElement();
  fragmentedPath_EventSet();
  edit_rect_EventSet();
  editpath_hover(true); //hoverイベントの再更新
  this.remove(); //クリックしたpath要素は削除
}

//くっつき状態のpathをバラバラ状態にする関数
function toFragmented(connectedPath){
  let max_frag_num = getMax_fragmented_Group_Number(); //connectedがもつfrag_numの最大数を取得する
  let dpoint = connectedPath.clear().array().settle();
  let fragmented_PathGroup = draw.group().addClass('fragmented_PathGroup');
  let fragmented_RectGroup = draw.group().addClass('fragmented_RectGroup');
  fragmented_PathGroup.attr({
    'id' : 'fragmented_PathGroup_' + String(max_frag_num + 1),
    'fragmented_Group_Number' : String(max_frag_num + 1),
    'connected_id' : connectedPath.attr('id'),
    'fill_tmp': connectedPath.attr('fill') , 'stroke_tmp': connectedPath.attr('stroke')
  })
  fragmented_RectGroup.attr({
    'id' : 'fragmented_RectGroup_' + String(max_frag_num + 1),
    'fragmented_Group_Number' : String(max_frag_num + 1)
  })
  if(dpoint[dpoint.length-1][0]==="Z"){
    fragmented_PathGroup.addClass('closed_path');
    fragmented_RectGroup.addClass('closed_path');
  }
  connectedPath.after(fragmented_PathGroup);
  for(let j = 0; j < dpoint.length - 1; j++){
    let fragmentedPath = fragmented_PathGroup.path().addClass('fragmented').addClass('SVG_Element').addClass('path');
    let rect = fragmented_RectGroup.rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('edit_rect').front(); ////重ね順を一番前に
    fragmentedPath.attr({
      'fill' : 'none', 'stroke' : connectedPath.attr('stroke'),
      'stroke-width': connectedPath.attr('stroke-width'),
      'stroke-dasharray' : connectedPath.attr('stroke-dasharray'),
      'stroke-linejoin': connectedPath.attr('stroke-linejoin')
    })
    if(fragmentedPath.attr('stroke-width') === 0){ //線幅が0の場合
      fragmentedPath.attr({
        'stroke-width': PS_WIDTH,
        'stroke-dasharray' : 4*PS_WIDTH + ' ' + PS_WIDTH,
        'Non_stroke' : 'true'
      })
    }
    rect.attr({
      'x' : dpoint[j][1] - rect.width()/2,
      'y' : dpoint[j][2] - rect.height()/2,
      'fill': EDIT_RECT_COLOR
    })
    if(j === 0){
      fragmentedPath.addClass('first_fragmentedPath');
      rect.addClass('first_rect');
    }
    if(j===dpoint.length - 2) fragmentedPath.addClass('last_fragmentedPath');
    if(dpoint[j+1][0]==="Z"){  //次の要素がZ要素である場合
      fragmentedPath.M({x: dpoint[j][1], y: dpoint[j][2]}).L({x: dpoint[0][1], y: dpoint[0][2]});
    }else{ //次の要素がZ要素でない場合
      fragmentedPath.M({x: dpoint[j][1], y: dpoint[j][2]}).L({x: dpoint[j+1][1], y: dpoint[j+1][2]});
      if(j === dpoint.length -2){
        let rect = fragmented_RectGroup.rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('edit_rect').addClass('last_rect').front(); ////重ね順を一番前に
        rect.attr({
          'x' : dpoint[j + 1][1] - rect.width()/2,
          'y' : dpoint[j + 1][2] - rect.height()/2,
          'fill': EDIT_RECT_COLOR
        })
      }
    }
  }
  let ghost_path = draw.path().attr({
    'id' : 'ghost_path_' + String(max_frag_num + 1),
    'fill' : connectedPath.attr('fill'),
    'fragmented_Group_Number' : String(max_frag_num + 1),
    'class' : 'ghost_path'
  });
  fragmented_PathGroup.before(ghost_path);
  update_ghostPath();
  checkEditPath_gadget();
}

/********************************************
//frag_pathのidの更新と選択用rectの追加
*********************************************/
function update_editElement(){
  draw.select('.fragmented_PathGroup').each(function(i , children){
    if(this.children().length === 0){
      let fragmented_Group_Number = this.attr('fragmented_Group_Number');
      SVG.get('#fragmented_RectGroup_' + String(fragmented_Group_Number)).remove();
      if(SVG.get('#ghost_path_' + String(fragmented_Group_Number))) SVG.get('#ghost_path_' + String(fragmented_Group_Number)).remove();
      this.remove();
    }
  })
  draw.select('.first_fragmentedPath').removeClass('first_fragmentedPath');
  draw.select('.last_fragmentedPath').removeClass('last_fragmentedPath');
  draw.select('.fragmented_PathGroup').each(function(i , children){
    let fragmented_Group_Number = this.attr('fragmented_Group_Number');
    let self = this;
    this.each(function(j , children){
      this.attr({
        'id' : 'path_' + String(fragmented_Group_Number) + '_' + String(j),
        'assignment_Number': String(j),
      })
      if(j===0) this.addClass('first_fragmentedPath');
      if(j===self.children().length - 1) this.addClass('last_fragmentedPath');
    })
  })
  draw.select('.first_rect').removeClass('first_rect');
  draw.select('.last_rect').removeClass('last_rect');
  draw.select('.fragmented_RectGroup').each(function(i , children){
    let fragmented_Group_Number = this.attr('fragmented_Group_Number');
    let self = this;
    this.each(function(j , children){
      this.attr({
        'id' : 'rect_' + String(fragmented_Group_Number) + '_' + String(j),
        'assignment_Number': String(j),
      })
      if(j===0) this.addClass('first_rect');
      if(j===self.children().length - 1) this.addClass('last_rect');
    })
  })
}

/*****************************************
//パスのイベントの登録
****************************************/
function fragmentedPath_EventSet(){
  let clickCount = 0;
  draw.select('.fragmented').off('mousedown').on('mousedown',function(e){ //mousedownイベントの登録
    editpath_hover(false);
    if(!input_key_buffer[16] && !this.hasClass('editing_target') && event.button===0) reset_editing_target();
    this.attr({ 'stroke' : PATH_EDIT_COLOR}).addClass('editing_target');
    if(e.button===0){ //左クリック時
      // シングルクリックの場合
      if( !clickCount) {
        move_editing();
        ++clickCount;
        setTimeout( function() {
          clickCount = 0;
        }, 350 ) ;
      // ダブルクリックの場合
      }else{
        let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
        let assignment_Number = this.attr('assignment_Number');
        let fragmentedPath1 = draw.path().M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: mx, y: my }).addClass('fragmented').addClass('SVG_Element').addClass('path');
        let fragmentedPath2 = draw.path().M({x: mx, y: my}).L({x: dpoint[1][1], y: dpoint[1][2] }).addClass('fragmented').addClass('SVG_Element').addClass('path');
        let rect = SVG.get('#fragmented_RectGroup_' + String(this.parent().attr('fragmented_Group_Number'))).rect(RECT_WIDTH/(1.5*draw.zoom()) , RECT_HEIGHT/(1.5*draw.zoom())).addClass('edit_rect').back();
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
        this.remove();
        update_editElement();
        fragmentedPath_EventSet();
        edit_rect_EventSet();
        editpath_hover(true);
        cash_svg();
        clickCount = 0;
      }
    }
  })
}

/****************************************
//rectのイベント登録
*****************************************/
function edit_rect_EventSet(){
  let clickCount = 0;
  draw.select('.edit_rect').off('mousedown').on('mousedown',function(e){ //mousedownイベントの登録
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
      // ダブルクリックの場合
      }else{
        delete_editpath_rect(this);
        update_editElement();
        fragmentedPath_EventSet();
        edit_rect_EventSet();
        update_ghostPath();
        editpath_hover(true); //hoverイベントの再更新
        checkEditPath_gadget();
        clickCount = 0;
      }
    }
  })
}

/****************************************
//fragmentedPath、edit_rectの移動関数
*****************************************/
function move_editing(){
  let init_x = mx, init_y = my; //クリックを行った点
  if(input_key_buffer[17]) editpath_mousemove('90degree',init_x,init_y);
  now_movingFlag = true;
  arrIntervalCnt.push($interval_move = setInterval(function(e){
        draw.select('.editing_target').each(function(i,children){
          if(this.hasClass('edit_rect')){
            let original_cx = this.attr('x') + this.width()/2, original_cy = this.attr('y') + this.height()/2; //クリックを行った点
            let cx = original_cx + mx - init_x , cy = original_cy + my - init_y;
            this.attr({'x':cx - this.width()/2}) , this.attr({'y':cy - this.height()/2}); //円の位置を格納
            let nears = getSimultaneouslyEdit_element(this);
            if(nears.beforePath){
              let dpoint = nears.beforePath.clear().array().settle(); //pathのdpoint配列を取得
              nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: cx, y: cy});
            }
            if(nears.afterPath){
              let dpoint = nears.afterPath.clear().array().settle(); //pathのdpoint配列を取得
              nears.afterPath.attr({'d':''}).M({x: cx, y: cy}).L({x: dpoint[1][1], y: dpoint[1][2]});
            }
          }else{
            let dpoint = this.clear().array().settle(); //pathのdpoint配列を取得
            let original_x1 = dpoint[0][1] , original_y1 = dpoint[0][2];
            let original_x2 = dpoint[1][1] , original_y2 = dpoint[1][2];
            let x1 = original_x1 - init_x + mx , y1 = original_y1 - init_y + my;
            let x2 = original_x2 - init_x + mx , y2 = original_y2 - init_y + my;
            this.attr({'d':''}).M({x: x1, y: y1}).L({x: x2, y: y2});
            let nears = getSimultaneouslyEdit_element(this);
            if(nears.beforeRect) nears.beforeRect.attr({'x':x1 - nears.beforeRect.width()/2,'y':y1 - nears.beforeRect.height()/2});
            if(nears.afterRect) nears.afterRect.attr({'x':x2 - nears.afterRect.width()/2,'y':y2 - nears.afterRect.height()/2});
            if(nears.beforePath){
              let dpoint = nears.beforePath.clear().array().settle();
              nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: x1, y: y1});
            }
            if(nears.afterPath){
              let dpoint = nears.afterPath.clear().array().settle();
              nears.afterPath.attr({'d':''}).M({x: x2, y: y2}).L({x: dpoint[1][1], y: dpoint[1][2]});
            }
          }
        })
        update_ghostPath();
        init_x = mx , init_y = my;
      }, //インターバルする関数の中身終了
    20) //時間周期
  )
}

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
  fragmentedPath_EventSet();
  edit_rect_EventSet();
  update_ghostPath();
  editpath_hover(true); //hoverイベントの再更新
  checkEditPath_gadget();
  if(delete_flag) cash_svg();
}

function delete_editpath_rect(editing_target){
  let nears = getSimultaneouslyEdit_element(editing_target); //rectの近傍要素を取得
  let new_fragmentedPath;
  if(nears.afterPath)afterPath_dpoint =  nears.afterPath.clear().array().settle(); //afterPathのdpoint配列を取得
  if(nears.beforePath)beforePath_dpoint =  nears.beforePath.clear().array().settle(); //beforePathのdpoint配列を取得
  if(nears.afterPath && nears.beforePath){
    new_fragmentedPath = draw.path().M({x: beforePath_dpoint[0][1], y: beforePath_dpoint[0][2]}).L({x: afterPath_dpoint[1][1], y: afterPath_dpoint[1][2]});
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
  let fragmented_PathGroup = SVG.get('fragmented_PathGroup_' + String(editing_target.parent().attr('fragmented_Group_Number')));
  if(fragmented_PathGroup.children().length < 2){ //線が閉じていて、グループ内に線が2本以下の場合
    if(fragmented_PathGroup.hasClass('closed_path')){
      fragmented_PathGroup.removeClass('closed_path');
      editing_target.parent().removeClass('closed_path');
      new_fragmentedPath.remove();
    }
  }
  editing_target.remove(); //editing_rectの削除
}

function delete_editpath_fragmentedPath(editing_target){
  if(!editing_target.parent().hasClass('closed_path')){
    var max_fragmented_Group_Number = getMax_fragmented_Group_Number();
    let new_fragmented_PathGroup = draw.group().addClass('fragmented_PathGroup');
    let new_fragmented_RectGroup = draw.group().addClass('fragmented_RectGroup');
    let current_fragmented_Group_Number = editing_target.parent().attr('fragmented_Group_Number');
    new_fragmented_PathGroup.attr({
      'id' : 'fragmented_PathGroup_' + String(max_fragmented_Group_Number + 1),
      'fragmented_Group_Number' : String(max_fragmented_Group_Number + 1),
      'connected_id' : editing_target.parent().attr('connected_id'),
      'fill_tmp': editing_target.parent().attr('fill_tmp') , 'stroke_tmp' : editing_target.parent().attr('stroke_tmp')
    })
    let ghost_path = draw.path().attr({
      'id' : 'ghost_path_' + String(max_fragmented_Group_Number + 1),
      'fill' : editing_target.parent().attr('fill_tmp'),
      'fragmented_Group_Number' : String(max_fragmented_Group_Number + 1),
      'class' : 'ghost_path'
    });
    new_fragmented_PathGroup.before(ghost_path);
    new_fragmented_RectGroup.attr({
      'id' : 'fragmented_RectGroup_' + String(max_fragmented_Group_Number + 1),
      'fragmented_Group_Number' : String(max_fragmented_Group_Number + 1),
    })
    editing_target.parent().before(new_fragmented_PathGroup);
    for(var j=0 ; j < Number(editing_target.attr('assignment_Number')) + 1; j++){
      new_fragmented_PathGroup.add(SVG.get('path_'+ String(current_fragmented_Group_Number) + '_'  + String(j)));
      new_fragmented_RectGroup.add(SVG.get('rect_'+ String(current_fragmented_Group_Number) + '_' + String(j)));
    }
  }else{
    let current_fragmented_Group_Number = editing_target.parent().attr('fragmented_Group_Number');
    for(var j=0 ; j < Number(editing_target.attr('assignment_Number')) + 1; j++){
      SVG.get('path_'+ String(current_fragmented_Group_Number) + '_'  + String(j)).front();
      SVG.get('rect_'+ String(current_fragmented_Group_Number) + '_'  + String(j)).front();
    }
    editing_target.parent().removeClass('closed_path');
    let fragmented_RectGroup = SVG.get('fragmented_RectGroup_'+ String(current_fragmented_Group_Number));
    if(fragmented_RectGroup) fragmented_RectGroup.removeClass('closed_path');
  }
  editing_target.remove(); //editing_pathの削除
}

/****************************************
//ノード結合関数
*****************************************/
function node_connect_function(){
  let connectRect = get_node_connectRect();
  let rect1 = connectRect.rect1 , rect2 = connectRect.rect2;
  if(rect1 && rect2){
    let fragmented_PathGroup1 = SVG.get('#fragmented_PathGroup_' + rect1.parent().attr('fragmented_Group_Number'));
    let fragmented_PathGroup2 = SVG.get('#fragmented_PathGroup_' + rect2.parent().attr('fragmented_Group_Number'));
    let fragmented_RectGroup1 = rect1.parent();
    let fragmented_RectGroup2 = rect2.parent();
    let connect_flag1 , connect_flag2;
    if(rect1.hasClass('first_rect')){
      connect_flag1 = 'first';
    }else{
      connect_flag1 = 'last';
    }
    if(rect2.hasClass('first_rect')){
      connect_flag2 = 'first';
    }else{
      connect_flag2 = 'last';
    }
    let new_path = draw.path().addClass('fragmented').addClass('SVG_Element').addClass('path');
    new_path.attr({
      'fill' : 'none','stroke' : fragmented_PathGroup1.attr('stroke_tmp'),
      'stroke-width': fragmented_PathGroup1.first().attr('stroke-width'),
      'stroke-dasharray': fragmented_PathGroup1.first().attr('stroke-dasharray'),
      'stroke-linejoin': fragmented_PathGroup1.first().attr('stroke-linejoin')
    })
    if(fragmented_PathGroup1 === fragmented_PathGroup2){
      if(rect1.hasClass('first')){
        new_path.M({x: rect1.cx(), y: rect1.cy()}).L({x: rect2.cx(), y: rect2.cy()});
      }else{
        new_path.M({x: rect2.cx(), y: rect2.cy()}).L({x: rect1.cx(), y: rect1.cy()});
      }
      fragmented_PathGroup1.add(new_path);
      new_path.front();
      fragmented_PathGroup1.addClass('closed_path');
      fragmented_RectGroup1.addClass('closed_path');
    }else{
      if(connect_flag1 === 'first' && connect_flag2 === 'first'){ //先端同士の場合
        new_path.M({x: rect1.cx(), y: rect1.cy()}).L({x: rect2.cx(), y: rect2.cy()});
        fragmented_PathGroup2.add(new_path);
        new_path.back();
        fragmented_PathGroup1.each(function(j , children){
          var dpoint = this.clear().array().settle();
          this.attr({ 'd' : 'M' + dpoint[1][1] + ' ' + dpoint[1][2] + 'L' + dpoint[0][1] + ' ' + dpoint[0][2] });
          fragmented_PathGroup2.add(this);
          this.back();
        })
        fragmented_RectGroup1.each(function(j,children){
          fragmented_RectGroup2.add(this);
          this.back();
        })
      }else if(connect_flag1 === 'first' && connect_flag2 === 'last'){
        new_path.M({x: rect2.cx(), y: rect2.cy()}).L({x: rect1.cx(), y: rect1.cy()});
        fragmented_PathGroup2.add(new_path);
        new_path.front();
        fragmented_PathGroup1.each(function(j , children){
          fragmented_PathGroup2.add(this);
          this.front();
        })
        fragmented_RectGroup1.each(function(j,children){
          fragmented_RectGroup2.add(this);
          this.front();
        })
      }else if(connect_flag1 === 'last' && connect_flag2 === 'first'){
        new_path.M({x: rect1.cx(), y: rect1.cy()}).L({x: rect2.cx(), y: rect2.cy()});
        fragmented_PathGroup1.add(new_path);
        new_path.front();
        fragmented_PathGroup2.each(function(j , children){
          fragmented_PathGroup1.add(this);
          this.front();
        })
        fragmented_RectGroup2.each(function(j,children){
          fragmented_RectGroup1.add(this);
          this.front();
        })
      }else{
        new_path.M({x: rect2.cx(), y: rect2.cy()}).L({x: rect1.cx(), y: rect1.cy()});
        fragmented_PathGroup2.add(new_path);
        new_path.front();
        let last_Path2 = fragmented_PathGroup2.last();
        let last_rect2 = fragmented_RectGroup2.last();
        fragmented_PathGroup1.each(function(j , children){
          var dpoint = this.clear().array().settle();
          this.attr({ 'd' : 'M' + dpoint[1][1] + ' ' + dpoint[1][2] + 'L' + dpoint[0][1] + ' ' + dpoint[0][2] });
          last_Path2.after(this);
        })
        fragmented_RectGroup1.each(function(j , children){
          last_rect2.after(this);
        })
      }
    }
    update_editElement();
    edit_rect_EventSet();
    fragmentedPath_EventSet();
    get_node_connectRect();
    reset_editing_target();
    editpath_hover(true); //hoverイベントの再更新
    cash_svg();
  }
}

function get_node_connectRect(){
  let edge_rect_num = 0;
  let ob = new Object();
  draw.select('.editing_target').each(function(i , children){
    if(this.hasClass('first_rect') || this.hasClass('last_rect')){
      if(!this.parent().hasClass('closed_path')){
        if(edge_rect_num === 0){
          ob.rect1 = this;
          edge_rect_num++;
        }else if(edge_rect_num === 1){
          if(ob.rect1.parent() !== this.parent()){
            ob.rect2 = this;
            edge_rect_num++;
          }else{
            if(this.parent().children().length > 2){
              ob.rect2 = this;
              edge_rect_num++;
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

/***********************************************
//選択したpath,rectの前後要素を探索する関数
***********************************************/
function getSimultaneouslyEdit_element(element , dbclick){
  var fragmented_Group_Number = Number(element.parent().attr('fragmented_Group_Number'));
  var assignment_Number = Number(element.attr('assignment_Number'));
  var ob = new Object();
  if(element.hasClass('edit_rect')){
    ob.beforePath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(assignment_Number - 1)); //進行方向でpathの前にある円
    ob.afterPath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(assignment_Number)); //進行方向でpathの後にある円

    if(element.parent().hasClass('closed_path') && element.hasClass('first_rect')){
      SVG.get('#fragmented_PathGroup_' + String(fragmented_Group_Number)).each(function(i,children){
        if(this.hasClass('last_fragmentedPath') && !this.hasClass('first_fragmentedPath'))ob.beforePath = this;
      })
    }
  }else{
    ob.beforeRect = SVG.get('rect_' + String(fragmented_Group_Number) + '_' + String(assignment_Number)); //進行方向でpathの前にある円
    ob.afterRect = SVG.get('rect_' + String(fragmented_Group_Number) + '_' + String(assignment_Number + 1)); //進行方向でpathの後にある円
    ob.beforePath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(assignment_Number - 1)); //進行方向でpathの前にある円
    ob.afterPath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(assignment_Number + 1)); //進行方向でpathの後にある円
    if(element.parent().hasClass('closed_path')){
      if(element.hasClass('last_fragmentedPath')){
        ob.afterRect = SVG.get('rect_' + String(fragmented_Group_Number) + '_' + String(0)); //進行方向で円の後にある円
        ob.afterPath = SVG.get('path_' + String(fragmented_Group_Number) + '_' + String(0));
      }else if(element.hasClass('first_fragmentedPath')){
        SVG.get('fragmented_PathGroup_' + String(fragmented_Group_Number)).each(function(i,children){
          if(this.hasClass('last_fragmentedPath'))ob.beforePath = this;
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
      var dpoint = this.clear().array().settle();
      var x1 = dpoint[0][1] , y1 = dpoint[0][2];
      var x2 = dpoint[1][1] , y2 = dpoint[1][2];
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
        var dpoint = nears.beforePath.clear().array().settle(); //pathのdpoint配列を取得
        nears.beforePath.attr({'d':''}).M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: x1, y: y1});
      }
      if(nears.afterPath){
        var dpoint = nears.afterPath.clear().array().settle(); //pathのdpoint配列を取得
        nears.afterPath.attr({'d':''}).M({x: x2, y: y2}).L({x: dpoint[1][1], y: dpoint[1][2]});
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
  if(draw.select('.fragmented_PathGroup').first()!==undefined){
    $('.stroke_option').show();
    $('#table_layer').show();
    $('#table_select_fill').show();
  }
}

/****************************************
//ghost_pathの更新
*****************************************/
function update_ghostPath(){
  draw.select('.ghost_path').each(function(i , children){
    let ghost_path = this;
    ghost_path.attr({'d' : ''});
    let fragmented_Group_Number = ghost_path.attr('fragmented_Group_Number');
    let fragmented_PathGroup = SVG.get('#fragmented_PathGroup_' + fragmented_Group_Number);
    fragmented_PathGroup.each(function(i , children){
      let dpoint = this.clear().array().settle() //pathのdpoint配列を取得
      if(i===0){
        ghost_path.M({x: dpoint[0][1], y: dpoint[0][2]}).L({x: dpoint[1][1], y: dpoint[1][2]})
      }else{
        ghost_path.L({x: dpoint[0][1], y: dpoint[0][2]}).L({x: dpoint[1][1], y: dpoint[1][2]})
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

function getMax_fragmented_Group_Number(){
  let max_fragmented_Group_Number = -1;
  draw.select('.fragmented_PathGroup').each(function(i, children) {
    if(max_fragmented_Group_Number < this.attr('fragmented_Group_Number')) max_fragmented_Group_Number = this.attr('fragmented_Group_Number');
  })
  return max_fragmented_Group_Number;
}
