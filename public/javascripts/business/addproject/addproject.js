$(document).ready(function() {
    free = function() {
        _fthis = this;
    };
    free.prototype = {
        _init: function() {
            _fthis._op();
        },
        _op: function() {
            $(".pf_span").click(function() {
                if ($(".pf_ul").css('display') == 'none') {
                    $(".pf_ul").slideDown();
                } else {
                    $(".pf_ul").slideUp();
                }
            });

            _fthis._selectProject();
            _fthis._deleteobject();

            $(".pf_add").click(function() {
                var op = $(this).data('op');
                if (op == 'hide') {
                    $(this).data({
                        'op': 'show'
                    });
                    $(this).text("保存项目");
                    $(".pf_addin").show();
                    $(".pf_addin").animate({
                        'width': '200px'
                    }, 1000, 'easeOutElastic');
                } else {
                    _fthis._checkproject();
                }
            });

            _fthis._downObject();

            $(".pf_save").click(function() {
                var projectUid = $(".pf_span").data('freeuid');
                var objectstr = "";
                for (var i = 0; i < $(".pf_con ul li").length; i++) {
                    if (objectstr != "") {
                        objectstr += ";" + $(".pf_con ul li").eq(i).text();
                    } else {
                        objectstr += $(".pf_con ul li").eq(i).text();
                    }
                }
                var data = {
                    uid: projectUid,
                    objectname: objectstr
                };
                $.ajax({
                    type: 'POST',
                    data: data,
                    dataType: 'json',
                    url: '/project/save',
                    success: function(back) {
                        if (back.state == 0) {
                            alert("保存成功");
                        } else {
                            alert("保存不成功");
                        }
                    }
                })
            });
        },

        _downObject: function() {
            var _this_tags = $(".pf_in");
            _this_tags.keypress(function(e) {
                if ($(".pf_span").data('freeuid') == -1) {
                    alert("请选择项目名");
                } else {
                    var btn_code = e.which;
                    if (btn_code === 13) {
                        var tags = _this_tags.val();
                        var tagsarray = [];
                        tagsarray = tags.split(/[;；]/);
                        $.each(tagsarray, function(index, val) {
                            var nowtags = val;
                            if (nowtags != "") {
                                var oldtags_length = $(".pf_con ul li").length;
                                var ishas = 0;
                                for (var i = 0; i < oldtags_length; i++) {
                                    if (nowtags.toLowerCase() === $(".pf_con ul li").eq(i).text().toLowerCase()) {
                                        ishas = 1;
                                    }
                                }
                                if (ishas == 0) {
                                    $(".pf_con ul").append("<li>" + nowtags + "</li>");
                                    _fthis._deleteobject();
                                }
                            }
                        });
                        _this_tags.val('');
                    }
                }
            });
        },

        _checkproject: function() {
            var pname = $(".pf_addin").val();
            if (pname == "") {
                alert("为空");
            } else {
                $(".pf_add").text("保存中");
                var data = {
                    projectname: pname
                };
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/project/addOne',
                    data: data,
                    success: function(back) {
                        console.log(back);
                        if (back.state == 0) {
                            // 保存成功
                            $(".pf_add").text("保存成功");
                            $(".pf_add").data({
                                'op': 'hide'
                            });
                            $(".pf_addin").animate({
                                'width': '0'
                            }, 'slow', function() {
                                $(".pf_addin").hide();
                                $(".pf_add").text("添加项目");
                            });
                            $("<li data-freeuid='" + back.uid + "'>" + pname + "</li>").appendTo($(".pf_ul"));
                            $(".pf_addin").val("");
                            _fthis._selectProject();
                        } else {
                            if (back.state == 1) {
                                // 已经存在
                                alert("已经存在");
                            } else {
                                alert("保存不成功");
                                // 保存不成功
                            }
                        }
                    }
                })
            }
        },

        _selectProject: function() {
            $(".pf_ul li").click(function() {
                var freeuid = $(this).data('freeuid');
                var pname = $(this).text();
                $(".pf_span").data({
                    freeuid: freeuid
                });
                $(".pf_span").text(pname);
                _fthis._getobject(freeuid, pname);
                $(".pf_ul").slideUp();
            });
        },

        _deleteobject: function() {
            $(".pf_con ul li").hover(function() {
                $(this).append("<span class='delete' onClick='_fthis._removeobject($(this))'>删除</span>");
            }, function() {
                $(this).children('.delete').remove();
            });
        },

        _removeobject: function(ele) {
            ele.parent('li').remove();
        },

        _getobject: function(uid, projectname) {
            var data = {
                uid: uid,
                projectname: projectname
            };
            $(".pf_con ul").html('');
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/project/getObject',
                data: data,
                success: function(back) {
                    if (back.objects.objectname != null) {
                        var nowObject = back.objects.objectname.split(/[;；]/);
                        var str = "";
                        for (var i = 0; i < nowObject.length; i++) {
                            str += "<li>" + nowObject[i] + "</li>";
                        }
                        $(".pf_con ul").append(str);
                        _fthis._deleteobject();
                    }
                }
            })
        }
    };
    var newFree = new free();
    newFree._init();
});