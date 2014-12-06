$(document).ready(function() {
    addPage = function() {
        _pthis = this;
        _pthis.pagename = null;
        _pthis.pagedec = null;
    };
    addPage.prototype = {
        _init: function() {
            _pthis._addPage();
        },
        _checkValue: function() {
            _pthis._getValue();
            if (_pthis.pagename == "") {
                return false;
            } else {
                return true;
            }
        },
        _getValue: function() {
            _pthis.pagename = $(".page_add_name").val();
            _pthis.pagedec = $(".page_add_dec").val();
        },
        _addPage: function() {
            $(".page_btn_add").click(function() {
                if (_pthis._checkValue()) {
                    $.ajax({
                        type: 'POST',
                        data: {
                            pagename: _pthis.pagename,
                            pagedec: _pthis.pagedec
                        },
                        dataType: 'json',
                        url: '/page/add',
                        success: function(back) {
                            if (back.state) {
                                alert("add success");
                                window.location.href = "/admin/index";
                            } else {
                                alert("add fail");
                            }
                        }
                    })
                } else {
                    alert("page name is null");
                }
            });
        }
    };

    var addPage = new addPage();
    addPage._init();
});