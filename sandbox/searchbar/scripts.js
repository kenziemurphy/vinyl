AwesompleteUtil.start('#search_artist',
 {  /* util options */
   url:    "https://oeeppedclg.execute-api.us-east-1.amazonaws.com/musicoctorobot/search?searchString=",
   urlEnd: "*",
   limit: 15
 }, 
 {  /* awesomplete options */
   minChars: 1,
   data: (rec, input) => {

    console.log(input);
    console.log(rec);

    return rec["name"]; 
  }
 }
);