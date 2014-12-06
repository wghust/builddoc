$(document).ready(function() {
    editpage = function() {
        _ethis = this;
        _ethis.page = {
            uid: null,
            pagename: null,
            pagedec: null
        };
    };
    editpage.prototype = {
        _init: function() {
            _ethis._updatePage();
        },
        _getValue: function() {
            _ethis.page = {
                uid: $(".block").data('pageid'),
                pagename: $(".page_add_name").val(),
                pagedec: $(".page_add_dec").val()
            };
        },
        _checkPage: function() {
            if (_ethis.page.pagename == "") {
                return false;
            } else {
                return true;
            }
        },
        _updatePage: function() {
            $(".page_btn_add").click(function() {
                _ethis._getValue();
                if (_ethis._checkPage()) {
                    $.ajax({
                        type: 'POST',
                        url: '/page/save',
                        data: {
                            page: _ethis.page
                        },
                        dataType: "json",
                        success: function(back) {
                            if (back.state) {
                                alert("update sucess");
                                window.location.href = "/admin/index";
                            } else {
                                alert("sorry,update fail");
                            }
                        }
                    })
                } else {
                    alert("the pagename is null");
                }
            });
        }
    };
    var editPage = new editpage();
    editPage._init();
});