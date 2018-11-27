
/******************************************************
//pathを解析して、くっつきモードとバラバラモード
//配列を介して切り替える関数
******************************************************/
function toConnected(editpath_flag){
  draw.select('.fragmented_PathGroup').each(function(i,children){
    if(SVG.get('fragmented_RectGroup_' + String(this.attr('fragmented_Group_Number')))){
      SVG.get('fragmented_RectGroup_' + String(this.attr('fragmented_Group_Number'))).remove();
    }
    var new_path = draw.path().addClass('connected').addClass('SVG_Element').addClass('path');
    this.after(new_path);
    editpath_array.push(new_path.attr('id'));
    let self = this;
    this.each(function(j,children){
      var dpoint = this.clear().array().settle() //pathのdpoint配列を取得
      if(j===0){
        new_path.M({x: dpoint[0][1], y: dpoint[0][2]});
        new_path.attr({ //線属性の指定
          'stroke': PATH_STROKE_COLOR,
          'stroke-width': this.attr('stroke-width'),
          'stroke-dasharray': this.attr('stroke-dasharray'),
        })
        if(this.attr('stroke-dasharray')){
          if( String( this.attr('stroke-dasharray') ).split(/\s/).length === 2 ){
            new_path.attr({ 'stroke-width': 0 , 'stroke-dasharray': '' })
          }
        }
      }else{
        new_path.L({x: dpoint[0][1], y: dpoint[0][2]})
      }
      if(!self.hasClass('closed_path') && j===self.children().length - 1) new_path.L({x: dpoint[1][1], y: dpoint[1][2]});
    })

    new_path.attr({'fill' : this.attr('fill_tmp')});
    if(this.hasClass('closed_path'))  new_path.Z();
    this.remove();
  })
  draw.select('.ghost_path').each(function(i, children) {
    this.remove()
  })
}

/***************************************************************************
//path（記号も含めた）と点字＆記号との距離間を計算し、近すぎないか判定する関数
****************************************************************************/

function distance_check(){
  draw.select('.path').each(function(i , children){
    let stroke_width = this.attr('stroke-width');
    if(this.visible() && stroke_width !== 0){
      var p4oint = get_p4oint(this);
      var self = this; //比較にするpathのid
      for(var j=0; j< p4oint.length; j++){
        var four_point = new Array();
        for(var k=0; k<4; k++){
          four_point[k] = new Array();
        }
        four_point[0][0] = p4oint[j].x0 , four_point[0][1] = p4oint[j].y0;
        four_point[1][0] = p4oint[j].x1 , four_point[1][1] = p4oint[j].y1;
        four_point[2][0] = p4oint[j].x2 , four_point[2][1] = p4oint[j].y2;
        four_point[3][0] = p4oint[j].x3 , four_point[3][1] = p4oint[j].y3;
  /**
        draw.circle(3.5).attr({'cx' : four_point[0][0]}).attr({'cy' : four_point[0][1]}).attr({'fill' : 'red'})
        draw.circle(3.5).attr({'cx' : four_point[1][0]}).attr({'cy' : four_point[1][1]}).attr({'fill' : 'blue'})
        draw.circle(3.5).attr({'cx' : four_point[2][0]}).attr({'cy' : four_point[2][1]}).attr({'fill' : 'green'})
        draw.circle(3.5).attr({'cx' : four_point[3][0]}).attr({'cy' : four_point[3][1]}).attr({'fill' : 'yellow'})
  **/
        for(var k=0; k<4; k++){
          if(k!==3){
            var fp0x = four_point[k][0] , fp0y = four_point[k][1];
            var fp1x = four_point[k+1][0] , fp1y = four_point[k+1][1];
            var lp = getLineParam(fp0x , fp0y , fp1x , fp1y);
          }else{
            var fp0x = four_point[k][0] , fp0y = four_point[k][1];
            var fp1x = four_point[0][0] , fp1y = four_point[0][1];
            var lp = getLineParam(fp0x , fp0y , fp1x , fp1y);
          }
          //点字との距離を計算し、近すぎないか判定
          draw.select('.braille').each(function(l , children){
            var distance_flg = false; //true時：距離が近すぎる
            var braille_p4oint = get_p4oint(this);

            var b1x = Number(braille_p4oint[0].x0) , b1y = Number(braille_p4oint[0].y0);
            var b2x = Number(braille_p4oint[0].x1) , b2y = Number(braille_p4oint[0].y1);
            var b3x = Number(braille_p4oint[0].x2) , b3y = Number(braille_p4oint[0].y2);
            var b4x = Number(braille_p4oint[0].x3) , b4y = Number(braille_p4oint[0].y3);

            var distance1 = Math.abs(lp.a * b1x + lp.b * b1y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
            var distance2 = Math.abs(lp.a * b2x + lp.b * b2y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
            var distance3 = Math.abs(lp.a * b3x + lp.b * b3y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
            var distance4 = Math.abs(lp.a * b4x + lp.b * b4y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);

            var relativeXY = get_relativeXY(fp0x ,fp0y, fp1x , fp1y , THRE_DISTANCE); //直線の領域のx,y座標

            if(distance1 < THRE_DISTANCE){
              if(b1x < relativeXY.max_x && b1x > relativeXY.min_x && b1y < relativeXY.max_y && b1y > relativeXY.min_y){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
            if(distance2 < THRE_DISTANCE){
              if(b2x < relativeXY.max_x && b2x > relativeXY.min_x && b2y < relativeXY.max_y && b2y > relativeXY.min_y){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
            if(distance3 < THRE_DISTANCE){
              if(b3x < relativeXY.max_x && b3x > relativeXY.min_x && b3y < relativeXY.max_y && b3y > relativeXY.min_y){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
            if(distance4 < THRE_DISTANCE){
              if(b4x < relativeXY.max_x && b4x > relativeXY.min_x && b4y < relativeXY.max_y && b4y > relativeXY.min_y){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
          })

          //記号との距離を計算し、近すぎないか判定
          draw.select('.symbol').each(function(i , children){
            let stroke_width = this.attr('stroke-width');
            if(self.attr('id') !== this.attr('id') && this.visible() && stroke_width !== 0){
              var symbol_p4oint = get_p4oint(this);
              for(var l=0; l< symbol_p4oint.length; l++){
                var b1x = Number(symbol_p4oint[l].x0) , b1y = Number(symbol_p4oint[l].y0);
                var b2x = Number(symbol_p4oint[l].x1) , b2y = Number(symbol_p4oint[l].y1);
                var b3x = Number(symbol_p4oint[l].x2) , b3y = Number(symbol_p4oint[l].y2);
                var b4x = Number(symbol_p4oint[l].x3) , b4y = Number(symbol_p4oint[l].y3);

                var distance1 = Math.abs(lp.a * b1x + lp.b * b1y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
                var distance2 = Math.abs(lp.a * b2x + lp.b * b2y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
                var distance3 = Math.abs(lp.a * b3x + lp.b * b3y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
                var distance4 = Math.abs(lp.a * b4x + lp.b * b4y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);

                var relativeXY = get_relativeXY(fp0x ,fp0y, fp1x , fp1y , THRE_DISTANCE); //直線の領域のx,y座標

                if(distance1 < THRE_DISTANCE){
                  if(b1x < relativeXY.max_x && b1x > relativeXY.min_x && b1y < relativeXY.max_y && b1y > relativeXY.min_y){
                    this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                    if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                  }
                }
                if(distance2 < THRE_DISTANCE){
                  if(b2x < relativeXY.max_x && b2x > relativeXY.min_x && b2y < relativeXY.max_y && b2y > relativeXY.min_y){
                    this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                    if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                  }
                }
                if(distance3 < THRE_DISTANCE){
                  if(b3x < relativeXY.max_x && b3x > relativeXY.min_x && b3y < relativeXY.max_y && b3y > relativeXY.min_y){
                    this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                    if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                  }
                }
                if(distance4 < THRE_DISTANCE){
                  if(b4x < relativeXY.max_x && b4x > relativeXY.min_x && b4y < relativeXY.max_y && b4y > relativeXY.min_y){
                    this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                    if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                  }
                }
              }
            }
          })
          //円記号との距離を計算し、近すぎないか判定
          draw.select('.circle').each(function(i , children){
            let stroke_width = this.attr('stroke-width');
            if(this.visible() && stroke_width !== 0){
              var cx = Number(this.attr('cx')) , cy = Number(this.attr('cy')); //円の中心座標
              var cr = Number(this.attr('r')); //円の半径

              var Unit_a = lp.a/Math.sqrt(lp.a * lp.a + lp.b * lp.b); //単位方向ベクトル
              var Unit_b = lp.b/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
              var b1x = cx + Unit_a * cr , b1y = cy + Unit_b * cr;

              var dif_0x = fp0x - cx , dif_0y = fp0y - cy;
              var dif_1x = fp1x - cx , dif_1y = fp1y - cy;

              var distance1 = Math.abs(lp.a * b1x + lp.b * b1y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
              var distance2 = Math.sqrt(dif_0x * dif_0x + dif_0y * dif_0y) - cr;
              var distance3 = Math.sqrt(dif_1x * dif_1x + dif_1y * dif_1y) - cr;

              var relativeXY = get_relativeXY(fp0x ,fp0y, fp1x , fp1y , THRE_DISTANCE); //直線の領域のx,y座標

              if(distance1 < THRE_DISTANCE){
                if(b1x < relativeXY.max_x && b1x > relativeXY.min_x && b1y < relativeXY.max_y && b1y > relativeXY.min_y){
                  this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                  if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                }
              }
              if(distance2 < THRE_DISTANCE){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
              if(distance3 < THRE_DISTANCE){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                if(self.hasClass('symbol'))self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
          })
        }
      }
    }
  })

  draw.select('.braille').each(function(i , children){
    if(this.visible()){
      var braille_p4oint = get_p4oint(this);
      var self = this; //比較にする点字のid
      var four_point = new Array();
      for(var k=0; k<4; k++){
        four_point[k] = new Array();
      }
      four_point[0][0] = Number(braille_p4oint[0].x0) , four_point[0][1] = Number(braille_p4oint[0].y0);
      four_point[1][0] = Number(braille_p4oint[0].x1) , four_point[1][1] = Number(braille_p4oint[0].y1);
      four_point[2][0] = Number(braille_p4oint[0].x2) , four_point[2][1] = Number(braille_p4oint[0].y2);
      four_point[3][0] = Number(braille_p4oint[0].x3) , four_point[3][1] = Number(braille_p4oint[0].y3);

      for(var k=0; k<4; k++){
        if(k!==3){
          var fp0x = four_point[k][0] , fp0y = four_point[k][1];
          var fp1x = four_point[k+1][0] , fp1y = four_point[k+1][1];
          var lp = getLineParam(fp0x , fp0y , fp1x , fp1y);
        }else{
          var fp0x = four_point[k][0] , fp0y = four_point[k][1];
          var fp1x = four_point[0][0] , fp1y = four_point[0][1];
          var lp = getLineParam(fp0x , fp0y , fp1x , fp1y);
        }

        //点字との距離を計算し、近すぎないか判定
        draw.select('.braille').each(function(l , children){
          if(self.attr('id') !== this.attr('id') && this.visible()){
            var distance_flg = false; //true時：距離が近すぎる
            var braille_p4oint = get_p4oint(this);

            var b1x = Number(braille_p4oint[0].x0) , b1y = Number(braille_p4oint[0].y0);
            var b2x = Number(braille_p4oint[0].x1) , b2y = Number(braille_p4oint[0].y1);
            var b3x = Number(braille_p4oint[0].x2) , b3y = Number(braille_p4oint[0].y2);
            var b4x = Number(braille_p4oint[0].x3) , b4y = Number(braille_p4oint[0].y3);

            var distance1 = Math.abs(lp.a * b1x + lp.b * b1y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
            var distance2 = Math.abs(lp.a * b2x + lp.b * b2y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
            var distance3 = Math.abs(lp.a * b3x + lp.b * b3y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
            var distance4 = Math.abs(lp.a * b4x + lp.b * b4y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);

            var relativeXY = get_relativeXY(fp0x ,fp0y, fp1x , fp1y , THRE_DISTANCE); //直線の領域のx,y座標

            if(distance1 < THRE_DISTANCE){
              if(b1x < relativeXY.max_x && b1x > relativeXY.min_x && b1y < relativeXY.max_y && b1y > relativeXY.min_y){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
            if(distance2 < THRE_DISTANCE){
              if(b2x < relativeXY.max_x && b2x > relativeXY.min_x && b2y < relativeXY.max_y && b2y > relativeXY.min_y){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
            if(distance3 < THRE_DISTANCE){
              if(b3x < relativeXY.max_x && b3x > relativeXY.min_x && b3y < relativeXY.max_y && b3y > relativeXY.min_y){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
            if(distance4 < THRE_DISTANCE){
              if(b4x < relativeXY.max_x && b4x > relativeXY.min_x && b4y < relativeXY.max_y && b4y > relativeXY.min_y){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
          }
        })

        //円記号との距離を計算し、近すぎないか判定
        draw.select('.circle').each(function(i , children){
          let stroke_width = this.attr('stroke-width');
          if(this.visible() && stroke_width !== 0){
            var cx = Number(this.attr('cx')) , cy = Number(this.attr('cy')); //円の中心座標
            var cr = Number(this.attr('r')); //円の半径

            var Unit_a = lp.a/Math.sqrt(lp.a * lp.a + lp.b * lp.b); //単位方向ベクトル
            var Unit_b = lp.b/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
            var b1x = cx + Unit_a * cr , b1y = cy + Unit_b * cr;

            var dif_0x = fp0x - cx , dif_0y = fp0y - cy;
            var dif_1x = fp1x - cx , dif_1y = fp1y - cy;

            var distance1 = Math.abs(lp.a * b1x + lp.b * b1y + lp.c)/Math.sqrt(lp.a * lp.a + lp.b * lp.b);
            var distance2 = Math.sqrt(dif_0x * dif_0x + dif_0y * dif_0y) - cr;
            var distance3 = Math.sqrt(dif_1x * dif_1x + dif_1y * dif_1y) - cr;

            var relativeXY = get_relativeXY(fp0x ,fp0y, fp1x , fp1y , THRE_DISTANCE); //直線の領域のx,y座標

            if(distance1 < THRE_DISTANCE){
              if(b1x < relativeXY.max_x && b1x > relativeXY.min_x && b1y < relativeXY.max_y && b1y > relativeXY.min_y){
                this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
                self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              }
            }
            if(distance2 < THRE_DISTANCE){
              this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
            }
            if(distance3 < THRE_DISTANCE){
              this.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
              self.addClass('distance_check').attr({'stroke': PATH_SELECT_COLOR });
            }
          }
        })
      }
    }
  })
  //距離が近いと判定された要素の表示と色の変更
  var dis_braille_num = 0 , dis_symbol_num = 0 , dis_circle_num = 0; //距離が近い要素の数
  draw.select('.distance_check').each(function(i , children){
    if(this.hasClass('braille')) dis_braille_num++;
    if(this.hasClass('symbol')) dis_symbol_num++;
    if(this.hasClass('circle')) dis_circle_num++;
    var bbox = get_bbox(this);
    var rx = bbox.min_x , ry = bbox.min_y;
    var width = bbox.max_x - bbox.min_x , height = bbox.max_y - bbox.min_y;
    var distance_rect = draw.rect(width , height);
    distance_rect.attr({
      'x' : rx,
      'y' : ry,
      'fill' : 'none',
      'stroke' : '#DAA520',
      'stroke-width' : PATH_STROKE_WIDTH/2,
      'class' : 'distance_rect'
    });
  })
  alert(  "距離間が近い要素の数\n" +
          "点字："+ dis_braille_num + "\n" +
          "記号："+ dis_symbol_num + "\n" +
          "円："+ dis_circle_num + "\n"
        );
}

//引数に指定した要素の4点座標を返す。pathの場合は配列＋objectで返す。
function get_p4oint(element){ //element : 対象の要素

  var four_point_array = new Array();
  if(element.hasClass('path')){
    var stroke_width = Number (element.attr('stroke-width') );
    var dpoint = element.clear().array().settle() //pathのdpoint配列を取得
    for(var j=0;j<dpoint.length-1; j++){
      var p1_x = 0 , p1_y = 0 , p2_x = 0 , p2_y = 0;
      if(dpoint[j+1][0]!=="Z"){  //次の要素がZ要素でない場合
        p1_x = Number(dpoint[j][1]) , p1_y = Number(dpoint[j][2]);
        p2_x = Number(dpoint[j+1][1]) , p2_y = Number(dpoint[j+1][2]);
      }else{  //次の要素がZ要素である場合
        p1_x = Number(dpoint[j][1]) , p1_y = Number(dpoint[j][2]);
        p2_x = Number(dpoint[0][1]) , p2_y = Number(dpoint[0][2]);
      }
      var angle = Math.atan((p2_y- p1_y)/(p2_x - p1_x))- Math.PI/2; //角度計算
      var four_point = new Object();
      four_point.x0 = stroke_width/2 * Math.cos(angle) + p1_x;
      four_point.y0 = stroke_width/2 * Math.sin(angle) + p1_y;
      four_point.x1 = stroke_width/2 * Math.cos(angle) + p2_x;
      four_point.y1 = stroke_width/2 * Math.sin(angle) + p2_y;
      four_point.x2 = -stroke_width/2 * Math.cos(angle) + p2_x;
      four_point.y2 = -stroke_width/2 * Math.sin(angle) + p2_y;
      four_point.x3 = -stroke_width/2 * Math.cos(angle) + p1_x;
      four_point.y3 = -stroke_width/2 * Math.sin(angle) + p1_y;
      four_point_array.push(four_point);
    }
  }else if(element.hasClass('braille')){
    var matrix = element.transform('matrix')
    var trans_matrix = [[matrix.a, matrix.c, matrix.e]
                      ,[matrix.b, matrix.d, matrix.f]
                      ,[0, 0, 1]];

    var corre_braille = element.attr('font-size')/4; //点字が占めるエリア領域の補正量 : ikarashi braille がデフォルトでそういう仕様になっている

    var pmin_x = Number(element.attr('x')) + corre_braille;
    var pmax_x = Number(element.attr('x')) + Number(element.bbox().width) - corre_braille;
    var pmin_y = Number(element.attr('y')) - Number(element.bbox().height);
    var pmax_y = Number(element.attr('y'));

    var position1 = [ [ pmin_x ],[ pmin_y ],[1]];
    var position2 = [ [ pmax_x ],[ pmin_y ],[1]];
    var position3 = [ [ pmin_x ],[ pmax_y ],[1]];
    var position4 = [ [ pmax_x ],[ pmax_y ],[1]];

    var trans1 = math.multiply(trans_matrix , position1);
    var trans2 = math.multiply(trans_matrix , position2);
    var trans3 = math.multiply(trans_matrix , position3);
    var trans4 = math.multiply(trans_matrix , position4);

    var four_point = new Object();
    four_point.x0 = Number(trans1[0][0]) , four_point.y0 = Number(trans1[1][0]);
    four_point.x1 = Number(trans2[0][0]) , four_point.y1 = Number(trans2[1][0]);
    four_point.x2 = Number(trans3[0][0]) , four_point.y2 = Number(trans3[1][0]);
    four_point.x3 = Number(trans4[0][0]) , four_point.y3 = Number(trans4[1][0]);
    four_point_array.push(four_point);

  }
  return four_point_array;
}

function reset_dcheck_element(){
  draw.select('.distance_check').each(function(i , children){
    this.removeClass('distance_check');
    let font_strokewidth = ($('input[name="braillefont"]:checked').val()==='IBfont') ? String(PATH_STROKE_WIDTH * 0.25) : '';
    let font_strokecolor = ($('input[name="braillefont"]:checked').val()==='IBfont') ? '#000000' : 'none';
    if(this.hasClass('braille')){
      this.attr({
        'stroke': font_strokecolor,
        'stroke-width': font_strokewidth
      })
    }else{
      this.attr({'stroke': '#000000' });
    }
  })
  draw.select('.distance_rect').each(function(i , children){
    this.remove();
  })
}

/*************************************
//不等角投影図を平面図化する関数
***************************************/

function fig_trans(){
  var current_mode =  $('input[name="tg_mode"]:checked');
  $(current_mode).prop('checked', true).trigger('change'); //モードを設定

  fig_connect();

  //左側角度、右側角度の取得
  var min_x = 1000000 ,  min_y = 1000000
  var max_x = -1000000 ,  max_y = -1000000

  var left_angle_param = Array.apply(null, Array(180)).map(function () {return 0 });//角度パラメータ追加用の配列
  var right_angle_param = Array.apply(null, Array(180)).map(function () {return 0 });

  draw.select('.connected').each(function(i,children){
    var dpoint = this.clear().array().settle() //pathのdpoint配列を取得
    for(var j=0; j < dpoint.length - 1; j++){
      if(dpoint[j + 1][0] !== 'Z'){
        var path_x1_base = Number( dpoint[j][1])
        var path_y1_base = Number( dpoint[j][2])
        var path_x2_base = Number( dpoint[j + 1][1])
        var path_y2_base = Number( dpoint[j + 1][2])
      }else{
        var path_x1_base = Number( dpoint[j][1])
        var path_y1_base = Number( dpoint[j][2])
        var path_x2_base = Number( dpoint[0][1])
        var path_y2_base = Number( dpoint[0][2])
      }

      if(min_x > path_x1_base) min_x = path_x1_base
      if(min_y > path_y1_base) min_y = path_y1_base
      if(max_x < path_x1_base) max_x = path_x1_base
      if(max_y < path_y1_base) max_y = path_y1_base

      if( (path_x2_base-path_x1_base)!=0 ){
        if(  ( (path_x2_base-path_x1_base)*(path_y2_base-path_y1_base) )  >= 0 ){
          var tan = Math.abs(path_y2_base-path_y1_base) / Math.abs(path_x2_base-path_x1_base );
          for(var l=0; l<180; l++){
            if(tan > Math.tan( (l/2)*Math.PI/180)){
              if(tan < Math.tan( ( (l+1)/2 )*Math.PI/180)){
                left_angle_param[l]++;
              }
            }
          }
        }else{
          var tan = Math.abs(path_y2_base-path_y1_base) / Math.abs(path_x2_base-path_x1_base );
          for(var l=0; l<180; l++){
            if(tan > Math.tan( (l/2)*Math.PI/180)){
              if(tan < Math.tan( ( (l+1)/2 )*Math.PI/180)){
                right_angle_param[l]++;
              }
            }
          }
        }
      }
    }
  })



  var left_k=45,right_k=45;
  var left_angle_max=0,right_angle_max=0;
  for(var k=0; k<180; k++){
    if(left_angle_param[k]>left_angle_max){
      left_angle_max=left_angle_param[k];
      left_k = k/2;
    }
    if(right_angle_param[k]>right_angle_max){
      right_angle_max=right_angle_param[k];
      right_k = k/2;
    }
  }

  var angleL = left_k
  var angleR = right_k

  //平面図化affin変換行列の計算

  var angle_x = angleL*Math.PI/180, angle_y = angleR*Math.PI/180; //角度をrad→degへ
  var TanAngL = Math.tan(angle_x), TanAngR = Math.tan(angle_y); //タンジェントを計算
  var thetaZ = Math.PI/2 -  Math.atan( Math.sqrt(TanAngL/TanAngR) ); //θZを計算
  var Yratio = TanAngR/Math.tan(thetaZ); //y軸方向への補正数を計算

  var point1 = new Array(); //affin変換行列作成に使う行列
  var point2 = new Array();
  for(var i=0;i<3;i++){
    point1[i]=new Array();
    point2[i]=new Array();
  }
  point1[0]=[0,0,Number(DRAW_AREA_WIDTH)];//Affine変換前の3座標の入力
  point1[1]=[0,Number(DRAW_AREA_HEIGHT),Number(DRAW_AREA_HEIGHT)];
  point1[2]=[1,1,1];

  point2[0]=[0,0,0];//Affin変換後の3座標の入力
  point2[1]=[0,0,0];
  point2[2]=[1,1,1];

  var center_x = (max_x + min_x)/2 ,center_y= (max_y + min_y)/2; //回転するときの軸
  var rotAx = point1[0][0] - center_x,rotAy = (center_y - point1[1][0])/Yratio;
  var rotBx = point1[0][1] - center_x,rotBy = (center_y - point1[1][1])/Yratio;
  var rotCx = point1[0][2] - center_x,rotCy = (center_y - point1[1][2])/Yratio;

  point2[0][0]=center_x + Math.cos(-thetaZ)*rotAx - Math.sin(-thetaZ)*rotAy; //affin変換後の座標を計算
  point2[1][0]=center_y - Math.sin(-thetaZ)*rotAx - Math.cos(-thetaZ)*rotAy;
  point2[0][1]=center_x + Math.cos(-thetaZ)*rotBx - Math.sin(-thetaZ)*rotBy;
  point2[1][1]=center_y - Math.sin(-thetaZ)*rotBx - Math.cos(-thetaZ)*rotBy;
  point2[0][2]=center_x + Math.cos(-thetaZ)*rotCx - Math.sin(-thetaZ)*rotCy;
  point2[1][2]=center_y - Math.sin(-thetaZ)*rotCx - Math.cos(-thetaZ)*rotCy;

  var affin_mat = math.multiply(point2 , math.inv(point1))

  //////////////////////////////////////////
  ///Affin変換(平面図化実施)
  //////////////////////////////////////////
  draw.select('.connected').each(function(i,children){
    var dpoint = this.clear().array().settle() //pathのdpoint配列を取得
    var new_dpoint = "";
    for(var j=0;j<dpoint.length; j++){
      if(dpoint[j][0]!=="Z"){  //属性がZ以外の場合
        var pos_array = [ [ dpoint[j][1] ],[ dpoint[j][2] ],[1]]; //pathの座標を格納
        var mat_pos = math.multiply(affin_mat,pos_array) //pathの座標をAffin変換
        new_dpoint += dpoint[j][0]+" "+mat_pos[0][0]+" "+mat_pos[1][0]; //新しい座標として格納
      }else{
        new_dpoint += dpoint[j][0]
      }
    }
    this.attr({'d':new_dpoint})
  })


  fig_straight();
  fig_connect();
  cash_svg();
}

function fig_straight(){
  var thre_angle_max = Math.tan( 75 * (Math.PI/180) ); //垂直線だと判定するための閾値
  var thre_angle_min = Math.tan( 15 * (Math.PI/180) ); //平行線だと判定するための閾値
  draw.select('.connected').each(function(i , children){
    var attr_d = ''
    var dpoint = this.clear().array().settle() //pathのdpoint配列を取得
    for(var j=0; j < dpoint.length - 1; j++){
      if(dpoint[j + 1][0] !== 'Z'){
        var path_x1_base = Number( dpoint[j][1])
        var path_y1_base = Number( dpoint[j][2])
        var path_x2_base = Number( dpoint[j + 1][1])
        var path_y2_base = Number( dpoint[j + 1][2])
      }else{
        var path_x1_base = Number( dpoint[j][1])
        var path_y1_base = Number( dpoint[j][2])
        var path_x2_base = Number( dpoint[0][1])
        var path_y2_base = Number( dpoint[0][2])
      }
      var tan = Math.abs(path_y2_base-path_y1_base) / Math.abs(path_x2_base - path_x1_base); //対象の直線の傾きを求める
      if(tan > thre_angle_max || tan < thre_angle_min ){
        if(tan > thre_angle_max) path_x1_base = path_x2_base;
        if(tan < thre_angle_min) path_y1_base = path_y2_base;
      }
      attr_d += dpoint[j][0] + ' ' + path_x1_base + ' ' +  path_y1_base + ' '
      if(j===dpoint.length - 2){
        if(dpoint[j + 1][0] === 'Z'){
          attr_d += 'Z '
        }else{
        attr_d += dpoint[j + 1][0] + ' ' + path_x2_base + ' ' +  path_y2_base + ' '
        }
      }
    }
    this.attr({'d' : attr_d})
  })
}

function fig_connect(){
  var thre_xy = 5
  var thre_distance = 5
  draw.select('.connected').each(function(i , children){
    var dpoint = this.clear().array().settle() //pathのdpoint配列を取得
    for(var j=0; j < dpoint.length - 1; j++){
      if(dpoint[j + 1][0] !== 'Z'){
        var path_x1_base = Number( dpoint[j][1])
        var path_y1_base = Number( dpoint[j][2])
        var path_x2_base = Number( dpoint[j + 1][1])
        var path_y2_base = Number( dpoint[j + 1][2])
      }else{
        var path_x1_base = Number( dpoint[j][1])
        var path_y1_base = Number( dpoint[j][2])
        var path_x2_base = Number( dpoint[0][1])
        var path_y2_base = Number( dpoint[0][2])
      }

      var relativeXY = get_relativeXY(path_x1_base ,path_y1_base, path_x2_base , path_y2_base , thre_xy); //直線の領域のx,y座標
      var line_param = getLineParam(path_x1_base , path_y1_base , path_x2_base , path_y2_base);

      draw.select('.connected').each(function(k , children){
        var attr_d = ''
        var dpoint_select = this.clear().array().settle() //pathのdpoint配列を取得
        for(var l=0; l < dpoint_select.length; l++){
          if(dpoint_select[l][0] !== 'Z'){
            var path_x1 = Number( dpoint_select[l][1] )
            var path_y1 = Number( dpoint_select[l][2] )


            var distance = Math.abs(line_param.a * path_x1 + line_param.b * path_y1 + line_param.c)/Math.sqrt(line_param.a * line_param.a + line_param.b * line_param.b);
            if(distance < thre_distance  && path_x1 > relativeXY.min_x && path_x1 < relativeXY.max_x && path_y1 > relativeXY.min_y && path_y1 < relativeXY.max_y){
              var straight_change_x = (line_param.b * line_param.b * path_x1 - line_param.a * line_param.b * path_y1 - line_param.a * line_param.c)/(line_param.a * line_param.a + line_param.b * line_param.b);
              var straight_change_y =  - (line_param.a * line_param.b * path_x1 - line_param.a * line_param.a * path_y1 + line_param.b * line_param.c)/(line_param.a * line_param.a + line_param.b * line_param.b);
              if(straight_change_x < (relativeXY.min_x + thre_xy) ){
                straight_change_x = relativeXY.min_x + thre_xy;
              }
              if(straight_change_x > (relativeXY.max_x - thre_xy) ){
                straight_change_x = relativeXY.max_x - thre_xy;
              }
              if(straight_change_y < (relativeXY.min_y + thre_xy) ){
                straight_change_y = relativeXY.min_y + thre_xy;
              }
              if(straight_change_y > (relativeXY.max_y - thre_xy) ){
                straight_change_y = relativeXY.max_y - thre_xy;
              }
            }else{
              var straight_change_x = path_x1
              var straight_change_y = path_y1
            }

            attr_d += dpoint_select[l][0] + ' ' + straight_change_x + ' ' + straight_change_y + ' '

          }else{
            attr_d += 'Z '
          }
        }
        this.attr({ 'd' : attr_d })
      })
    }
  })
}
