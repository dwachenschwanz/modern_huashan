class Common {
    makeActionIDfrom(display, menu) {

        var id = display.split(" ").join("");
        id = id.split("/").join("_")

        while (this.isActionIDduplicate(id, menu)) {
            id = id+"0";
        }
        return id;
    }

    isActionIDduplicate(id, menu) {
        var answer = false;
        var displayIDArray = menu.map(function(item) {
            return item.ID;
        });
        if (displayIDArray.indexOf(id) !== -1) {
            answer = true;
        }
        return answer;
    }
}