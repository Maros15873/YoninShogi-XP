var socket = io();

//Tomas, tuto funkciu si pomenuj ako chces, zmen ju alebo zmaz
function start () {
    var params = jQuery.deparam(window.location.search);
    console.log(params);

    //hrac1
    console.log(params.id1);
    console.log(params.name1);
    console.log(params.room1);

    //hrac2
    console.log(params.id2);
    console.log(params.name2);
    console.log(params.room2);

    //hrac3
    console.log(params.id3);
    console.log(params.name3);
    console.log(params.room3);

    //hrac4
    console.log(params.id4);
    console.log(params.name4);
    console.log(params.room4);

    window.history.replaceState(null, null, window.location.pathname); // REMOVING PARAMS FROM URL
}
