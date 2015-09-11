$(document).ready(function() {
    addCase = function() {
        _cthis = this;
        _cthis._casename = "";
        _cthis._grade = 3;
        _cthis._panel = "windows";
        _cthis._version = "0.0.0";
        _cthis._modal = "iphone";
    };
    addCase.prototype = {
        _init: function() {
            _cthis._op();
        },
        _op: function() {
            $(".queshow").hover(function() {
                $(".showmsg").css({
                    'display': 'block'
                });
                $(".showmsg").animate({
                    'top': '20px',
                    'opacity': 1
                }, 400);
            }, function() {
                $(".showmsg").animate({
                    'top': '40px',
                    'opacity': 0
                }, 400, function() {
                    $(this).css({
                        'display': 'none'
                    });
                });
            });


            $(".cpanel_s").click(function() {
                var _this_ul = $(this).siblings('ul');
                if (_this_ul.css('display') == 'none') {
                    _this_ul.css({
                        'display': 'block'
                    });
                    _this_ul.animate({
                        'top': '20px',
                        'opacity': 1
                    }, 400);
                } else {
                    _this_ul.animate({
                        'top': '50px',
                        'opacity': 0
                    }, 400, function() {
                        _this_ul.css({
                            'display': 'none'
                        });
                    });
                }
            });

            $(".cpanel_1 ul li").click(function() {
                $(this).parent('ul').siblings('.cpanel_s').text($(this).text());
                var _this_ul = $(this).parent('ul');
                _this_ul.animate({
                    'top': '50px',
                    'opacity': 0
                }, 400, function() {
                    _this_ul.css({
                        'display': 'none'
                    });
                });
            });
            $(".cpanel_2 ul li").click(function() {
                $(this).parent('ul').siblings('.cpanel_s').text($(this).text());
                $(this).parent('ul').siblings('.cpanel_s').data({
                    'id': $(this).data('id')
                });
                var _this_ul = $(this).parent('ul');
                _this_ul.animate({
                    'top': '50px',
                    'opacity': 0
                }, 400, function() {
                    _this_ul.css({
                        'display': 'none'
                    });
                });
            });
            $(".cupdate").click(function() {
                if (_cthis._check()) {
                    _cthis._addCase();
                }
            });
        },
        _getValue: function() {
            _cthis._casename = $(".case_name").val();
            _cthis._grade = parseInt($(".cradio:checked").val());
            _cthis._panel = $(".cpanel_panel").text();
            _cthis._version = $(".case_version").val();
            _cthis._modal = $(".case_model").val();
            _cthis._page = {
                id: parseInt($(".cpanel_pageid").data('id')),
                name: $(".cpanel_pageid").text()
            };
        },
        _check: function() {
            _cthis._getValue();
            var a = true;
            if (_cthis._casename == "") {
                alert("案例名为空");
                a = false;
            } else {
                if (_cthis._version == "") {
                    alert("版本号1为空");
                    a = false;
                } else {
                    if (_cthis._term == "") {
                        alert("前提条件为空");
                        a = false;
                    }
                }
            }
            return a;
        },
        _addCase: function() {
            $(".spin").show();
            $.ajax({
                url: '/case/update',
                type: 'POST',
                dataType: 'json',
                data: {
                    _id: $(".editcase").data('caseid'),
                    casename: _cthis._casename,
                    grade: _cthis._grade,
                    version: _cthis._version,
                    panel: _cthis._panel,
                    modal: _cthis._modal,
                    page: _cthis._page
                },
                success: function(callback) {
                    var back = callback;
                    $(".spin").hide();
                    if (back.state == true) {
                        window.location.href = back.url;
                    } else {
                        alert("创建不成功");
                    }
                }
            })
        }
    };

    newCase = new addCase();
    newCase._init();
});