function checkAllByClass(id, className) {
    $("#" + id + " ." + className).each(function() {
        $(this).prop("checked", true);
    });
}

function uncheckAllByClass(id, className) {
    $("#" + id + " ." + className).each(function() {
        $(this).prop("checked", false);
    });
}

function toggleAllByClass(id, className, me) {
    if (me.checked) {
        checkAllByClass(id, className);
    } else {
        uncheckAllByClass(id, className);
    }
}