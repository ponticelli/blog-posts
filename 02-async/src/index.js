(function() {
    function begin() {
        console.log("begin");
        return 0;
    }

    function end() {
        console.log("end");
    }

    function incrementAsync(i) {
        var defer = Q.defer();
        setTimeout(function() {
            i++;
            console.log(i);
            defer.resolve(i);
        }, 0);

        return defer.promise;
    }

    Q.fcall(begin)
        .then(incrementAsync)
        .then(incrementAsync)
        .then(incrementAsync)
        .then(end);
}());
