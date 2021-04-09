const express = require('express');
const routes = express.Router();
const firebase = require('firebase/app');
const firebase_nor = require('firebase');
const admin = require('firebase-admin');
const { data, contains } = require('jquery');
const { app } = require('firebase-admin');
const stream = require('stream');
const multipart = require('connect-multiparty');
const saltedMd5 = require('salted-md5');
const path = require('path');
var XMLHttpRequest = require('xmlhttprequest');

require('firebase/database');
require('firebase/storage');
require('date-utils');
var moment = require('moment');
const multer = require('multer');
const { runInContext } = require('vm');
const { read } = require('fs');
var upload = multer({storage: multer.memoryStorage()});
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

mainID = ''
adminID = ''

var config = {
   apiKey: "AIzaSyB3tW-qJ4uafbNojcVTryadZqmpb1mwvA4",
   authDomain: "final-project-web-c6937.firebaseapp.com",
   databaseURL: "https://final-project-web-c6937.firebaseio.com",
   projectId: "final-project-web-c6937",
   storageBucket: "final-project-web-c6937.appspot.com",
   messagingSenderId: "47763043642",
   appId: "1:47763043642:web:7b6f9462e6ba8546fbcc03",
   measurementId: "G-R5XE2S3XRP"
};
firebase.initializeApp(config);

var database = firebase.database();
var storage = firebase.storage();
var storageRef = firebase.storage().ref();

routes.get('/', function(req, res, next){
   database.ref('item').once('value').then(function(snapshot){
      var item_info = (snapshot.val()) || 'Anonymous';
      var item_ID = Object.keys(item_info);
      item_ID.sort(function(){
         return Math.random() - Math.random();
      });
      item_ID = item_ID.slice(0, 6);
      var item_list = [];
      cnt = 0;
      for(i in item_ID){
         var ID = item_ID[cnt];
         item_info[ID].ID= ID;
         item_list.push(item_info[ID])
         cnt += 1;
         if(cnt == item_ID.length){
            res.render('main_page', {rows:mainID, product:item_list});
         }
      }
   });
});

routes.get('/login', function(req, res, next){
   res.render('login');
});

routes.post('/', function(req, res, next){
   if(!req.body.ID){
      res.send('<script>alert("Please enter ID!"); window.location.href="/login";</script>');
   }
   else if(!req.body.password){
      res.send('<script>alert("Please enter password!"); window.location.href="/login";</script>');
   }
   else{
      var ID = req.body.ID;
      var pw = req.body.password;
      return database.ref('/users/'+ID).once('value').then(function(snapshot){
         var check = (snapshot.val() && snapshot.val().password) || 'Anonymous';
         if(check == 'Anonymous' || pw != check){
            res.send('<script>alert("Wrong ID / Password!"); window.location.href="/login";</script>');
         }
         else{
            mainID = ID;
            database.ref('item').once('value').then(function(snapshot){
               var item_info = (snapshot.val()) || 'Anonymous';
               var item_ID = Object.keys(item_info);
               item_ID.sort(function(){
                  return Math.random() - Math.random();
               });
               item_ID = item_ID.slice(0, 6);
               var item_list = [];
               cnt = 0;
               for(i in item_ID){
                  var ID = item_ID[cnt];
                  item_info[ID].ID= ID;
                  item_list.push(item_info[ID])
                  cnt += 1;
                  if(cnt == item_ID.length){
                     res.render('main_page', {rows:mainID, product:item_list});
                  }
               }
            });
            //res.render('main_page',{rows: mainID});
         }
      });
   }
});

routes.get('/register', function(req, res, next){
   res.render('register');
});

routes.post('/register', function(req, res, next){
   if (!req.body.ID || !req.body.password || !req.body.email || !req.body.phone || !req.body.birth) {
      res.send('<script>alert("Please enter all information!"); window.history.back();</script>');
   }
   else if((req.body.ID).length < 3 || (req.body.ID).length > 20){
      res.send('<script>alert("Please check your ID!"); window.history.back();</script>');
   }
   else if((req.body.password).length < 3 || (req.body.password).length > 20){
      res.send('<script>alert("Please check your password!"); window.history.back();</script>');
   }
   else if(!(req.body.email).includes('@')){
      res.send('<script>alert("Please check your Email!"); window.history.back();</script>');
   }
   else{
      var ID = req.body.ID;
      return database.ref('/users/' + ID).once('value').then(function(snapshot){
         var check = (snapshot.val() && snapshot.val().password) || 'Anonymous';
         if(check == "Anonymous"){
            writeID(req.body.name, ID, req.body.password, req.body.phone, req.body.birth, req.body.email);
            console.log('registered!')
            res.send('<script>alert("You are registed!"); window.location.href="/";</script>');
         }
         else{
            res.send('<script>alert("ID exists!"); window.location.href="/register";</script>');
         }
      });
   }
   //res.send('<script>alert("Success!"); window.location.href="/register";</script>')
});

routes.post('/logout', function(req, res, next){
   mainID='';
   res.redirect('/');
});

routes.get('/category', function(req, res, next){
   var cat='';
   if(req.query.cat){
      cat = req.query.cat;
   }
   var min=0, max=0, end='', valid=false;
   if(req.query.min) min = Number(req.query.min);
   if(req.query.max) max = Number(req.query.max);
   if(req.query.end) {
      end = req.query.end;
      end = new Date(Number(end.substring(0, 4)), Number(end.substring(5, 7)), Number(end.substring(8, 10)));
   }
   if(req.query.valid){
      valid = req.query.valid;
   }
   database.ref('/item').once('value').then(function(snapshot){
      var item_info = (snapshot.val()) || 'Anonymous';
      var item_key = Object.keys(item_info);
      var cnt = 0;
      for(var i in item_key){
         var val = cal_time(item_info[item_key[i]].end);
         item_info[item_key[i]].time_left = val;
         cnt += 1;
         if(cat != '' && item_info[item_key[i]].category != cat) delete item_info[item_key[i]];
         else if(min != 0 && item_info[item_key[i]].price < min) delete item_info[item_key[i]];
         else if(max != 0 && item_info[item_key[i]].price > max) delete item_info[item_key[i]];
         else {
            var cur_date = item_info[item_key[i]].end;
            cur_date = new Date(Number(cur_date.substring(0, 4)), Number(cur_date.substring(5, 7)), Number(cur_date.substring(8, 10)));
            if(end != ''){
               var cal = (end.getTime() - cur_date.getTime());
               if(cal < 0) delete item_info[item_key[i]];
            }
         }
         if(cnt == item_key.length){
            //console.log(item_info);
            res.render('category',{rows:mainID, items:item_info, items_key: item_key, valid:valid});
         }
      }
   });
});

routes.get('/add_like', function(req, res, next){
   var ID = mainID;
   var itemID = req.query.itemID;
   var val = req.query;
   delete val['itemID'];
   database.ref('/like/'+ID).once('value').then(function(snapshot){
      var past = (snapshot.val()) || '';
      var flag=0;
      if(past == '') past = itemID;
      else {
         past = past['itemID'];
         if(past.includes(itemID)){
            flag=1;
            res.send('<script>alert("Already in Wish List!"); window.history.back();</script>');
         }
         past = past + '&' + itemID;
      }
      if(flag==0){
         database.ref('/like/'+ID).set({
            itemID:past
         });
         database.ref('/item/'+itemID).once('value').then(function(snapshot){
            var past_like = (snapshot.val()) || '';
            past_like = past_like['like'];
            past_like = Number(past_like) + 1;
            database.ref('/item/'+itemID).update({
               like:past_like
            });
            res.send('<script>alert("Added to Wish List!"); window.history.back();</script>');
         });
         
      }
   });
});


routes.get('/q_upload', function(req, res, next){
   var question = req.query.q;
   var itemID = req.query.itemID;
   var ID = mainID;
   database.ref('/qna/'+itemID).once('value').then(function(snapshot){
      var info = (snapshot.val()) || '';
      var Q = '', A = '';
      if(info != ''){
         Q = info['Q'];
         A = info['A'];
         var q_val = Q.split('/');
         var len = (q_val.length+1).toString();
         Q = Q+'/'+len+'&'+ID+'&'+question;
         A = A+'/'+len+'& ';
      }
      else{
         Q = '1&'+ID+'&'+question;
         A = '1& ';
      }
      database.ref('/qna/'+itemID).set({
         Q:Q,
         A:A
      });
      var cur_url = req.query.cur;
      res.redirect(cur_url);
   });
});

routes.get('/a_upload', function(req, res, next){
   var answer = req.query.a;
   var itemID = req.query.itemID;
   var ID = mainID;
   database.ref('/qna/'+itemID).once('value').then(function(snapshot){
      var info = (snapshot.val()) || '';
      var Q = info['Q'];
      var A = info['A'];
      var A_list = A.split('/');
      var num = Number(req.query.q_num);
      if(num > A_list.length){
         res.send('<script>alert("Not valid Question number"); window.history.back();</script>');
         return;
      }
      A_list[num-1] = num.toString() + "&" + answer;
      var new_A = '';
      for(var i in A_list){
         if(i != 0) new_A = new_A + '/';
         new_A = new_A + A_list[i];
      }
      database.ref('/qna/'+itemID).set({
         Q:Q,
         A:new_A
      });
      var cur = req.query.cur;
      res.redirect(cur);
   });
});

routes.get('/item', function(req, res, next){
   var ID = mainID;
   var itemID = req.query.itemID;
   database.ref('/item').once('value').then(function(snapshot){
      var all_info = (snapshot.val()) || '';
      var item_info = all_info[itemID];
      delete all_info[itemID];
      var all_key = Object.keys(all_info);
      var seller = item_info['seller'];
      database.ref('/users/'+seller).once('value').then(function(snapshot){
         var seller_info = (snapshot.val()) || '';
         moment.tz.setDefault("Asia/Seoul");
         var cur_time = new moment().format('YYYY-MM-DD HH:mm:ss');
         var end_time = item_info['end'];
         cur_time = new Date(Number(cur_time.substring(0, 4)), Number(cur_time.substring(5, 7)), Number(cur_time.substring(8, 10)), Number(cur_time.substring(11, 13)), Number(cur_time.substring(14,16)), Number(cur_time.substring(17,19)));
         end_time = new Date(Number(end_time.substring(0, 4)), Number(end_time.substring(5, 7)), Number(end_time.substring(8, 10)), Number(end_time.substring(11, 13)), Number(end_time.substring(14,16)), Number(end_time.substring(17,19)));
         var sec = (end_time.getTime() - cur_time.getTime())/1000;
         sec = Math.floor(sec);
         var min = Math.max(Math.floor(sec/60), 0);
         sec = sec - min*60;
         var hour = Math.max(Math.floor(min/60),0);
         min = min - hour*60;
         var day = Math.max(Math.floor(hour/24), 0);
         hour = hour - day*24;
         var end_info = {};
         end_info['day'] = day;
         end_info['hour'] = hour;
         end_info['min'] = min;
         end_info['sec'] = sec;
         //console.log(end_info);
         seller_info['ID'] = seller;
         database.ref('/qna/'+itemID).once('value').then(function(snapshot){
            var qna_info = (snapshot.val()) || '';
            if(qna_info == ''){
               res.render('item', {rows:mainID, item:item_info, seller:seller_info, time_left:end_info, all:all_info, all_key:all_key, itemID:itemID, Q:Q, A:A});
            }
            else{
               var q_info = qna_info['Q'];
               var a_info = qna_info['A'];
               q_info = q_info.split('/');
               a_info = a_info.split('/');
               var Q = {}, A = {};
               for(var i=0;i<q_info.length;i++){
                  var tmp = (i+1).toString();
                  var any = q_info[i].split('&');
                  Q[tmp] = {};
                  Q[tmp]['num'] = tmp;
                  Q[tmp]['ID'] = any[1];
                  Q[tmp]['q'] = any[2];
                  any = a_info[i].split('&');
                  A[tmp] = {};
                  A[tmp]['num'] = tmp;
                  A[tmp]['a'] = any[1];
               }
               res.render('item', {rows:mainID, item:item_info, seller:seller_info, time_left:end_info, all:all_info, all_key:all_key, itemID:itemID, Q:Q, A:A});
            }
         });
      });
   });
});

routes.get('/bid_upload', function(req, res, next){
   var ID = mainID;
   var itemID = req.query.itemID;
   var price = req.query.price;
   database.ref('/item/'+itemID).update({
      buyer:ID,
      price:price
   });
   database.ref('/cart/'+ID).once('value').then(function(snapshot){
      var info = (snapshot.val()) || '';
      var cart_itemID = '', cart_price = '';
      if(info == ''){
         cart_itemID = itemID;
         cart_price = price;
      }
      else{
         var past_itemID = info['itemID'];
         var past_price = info['price'];
         past_itemID = past_itemID.split('&');
         past_price = past_price.split('&');
         if(past_itemID.includes(itemID)){
            var loc = past_itemID.indexOf(itemID);
            past_price[loc] = price;
         }
         else{
            var len = past_itemID.length;
            past_itemID[len] = itemID;
            past_price[len] = price;
         }
         for(i in past_itemID){
            if(i != 0) {
               cart_itemID = cart_itemID + '&';
               cart_price = cart_price + '&';
            }
            cart_itemID = cart_itemID + past_itemID[i];
            cart_price = cart_price + past_price[i];
         }
      }
      database.ref('/cart/'+ID).set({
         itemID:cart_itemID,
         price:cart_price
      });
      var cur = req.query.cur;
      res.redirect(cur);
   });
});

routes.get('/imm_upload', function(req, res, next){
   var ID = mainID;
   var itemID = req.query.itemID;
   var price = req.query.price;
   moment.tz.setDefault("Asia/Seoul");
   var new_time = new moment().format('YYYY-MM-DD HH:mm:ss');
   database.ref('/item/'+itemID).update({
      buyer:ID,
      end:new_time,
      price:price
   });

   database.ref('/cart/'+ID).once('value').then(function(snapshot){
      var info = (snapshot.val()) || '';
      var cart_itemID = '', cart_price = '';
      if(info == ''){
         cart_itemID = itemID;
         cart_price = price;
      }
      else{
         var past_itemID = info['itemID'];
         var past_price = info['price'];
         past_itemID = past_itemID.split('&');
         past_price = past_price.split('&');
         if(past_itemID.includes(itemID)){
            var loc = past_itemID.indexOf(itemID);
            past_price[loc] = price;
         }
         else{
            var len = past_itemID.length;
            past_itemID[len] = itemID;
            past_price[len] = price;
         }
         for(i in past_itemID){
            if(i != 0) {
               cart_itemID = cart_itemID + '&';
               cart_price = cart_price + '&';
            }
            cart_itemID = cart_itemID + past_itemID[i];
            cart_price = cart_price + past_price[i];
         }
      }
      database.ref('/cart/'+ID).set({
         itemID:cart_itemID,
         price:cart_price
      });
      var cur = req.query.cur;
      res.redirect(cur);
   });
});

routes.get('/mypage', function(req, res, next){
   var ID = mainID;
   database.ref('/item/').once('value').then(function(snapshot){
      var check = (snapshot.val()) || 'Anonymous';
      var items = [];
      var len = Object.keys(check).length;
      var check_key = Object.keys(check);
      var cnt = 0;
      for(var i in check_key){
         var seller = check[check_key[i]].seller;
         if(seller == ID){
            moment.tz.setDefault("Asia/Seoul");
            var cur_time = new moment().format('YYYY-MM-DD HH:mm:ss');
            var end_time = check[check_key[i]].end;
            cur_time = new Date(Number(cur_time.substring(0, 4)), Number(cur_time.substring(5, 7)), Number(cur_time.substring(8, 10)), Number(cur_time.substring(11, 13)), Number(cur_time.substring(14,16)), Number(cur_time.substring(17,19)));
            end_time = new Date(Number(end_time.substring(0, 4)), Number(end_time.substring(5, 7)), Number(end_time.substring(8, 10)), Number(end_time.substring(11, 13)), Number(end_time.substring(14,16)), Number(end_time.substring(17,19)));
            var end_info = {};
            var sec = (end_time.getTime() - cur_time.getTime())/1000;
            if(sec > 0){
               sec = Math.floor(sec);
               var minute = Math.max(Math.floor(sec/60), 0);
               sec = sec - minute*60;
               var hour = Math.max(Math.floor(minute/60),0);
               minute = minute - hour*60;
               var day = Math.max(Math.floor(hour/24), 0);
               hour = hour - day*24;
               end_info['day'] = day;
               end_info['hour'] = hour;
               end_info['min'] = minute;
               end_info['sec'] = sec;
            }
            else{
               end_info['day'] = '0';
               end_info['hour'] = '0';
               end_info['min'] = '0';
               end_info['sec'] = '0';
            }
            check[check_key[i]].end_info = end_info;
            check[check_key[i]].ID = check_key[i];
            items.push(check[check_key[i]]);
         }
         cnt++;
         if(cnt == len) {
            res.render('mypage', {rows:mainID, items:items});
         }
      }
   });
   //res.render('mypage', {rows:mainID, items:''});
});

routes.get('/item_modify', function(req, res, next){
   var num = req.query.num;
   num = Number(num);
   var name = req.query.name;
   var cat = req.query.cat;
   var loc = req.query.loc;
   var price = req.query.price;
   var price_end = req.query.price_end;
   var des = req.query.des;
   
   database.ref('/item').once('value').then(function(snapshot){
      var check = (snapshot.val()) || 'Anonymous';
      var items = [];
      var len = Object.keys(check).length;
      var check_key = Object.keys(check);
      var cnt = 0;
      for(var i in check_key){
         if(check[check_key[i]].seller == mainID){
            check[check_key[i]].ID = check_key[i];
            items.push(check[check_key[i]]);
         }
      }
      var mod_item = items[num];
      if(mod_item.buyer != '' && (price != '' || price_end != '')){
         res.send('<script>alert("You can not change price after the bidding!"); window.history.back();;</script>');
      }
      else{
         if(name != ''){
            database.ref('/item/'+mod_item.ID).update({
               name:name
            });
         }
         if(cat != ''){
            database.ref('/item/'+mod_item.ID).update({
               category:cat
            });
         }
         if(loc != ''){
            database.ref('/item/'+mod_item.ID).update({
               location:loc
            });
         }
         if(price != ''){
            database.ref('/item/'+mod_item.ID).update({
               price:price
            });
         }
         if(price_end != ''){
            database.ref('/item/'+mod_item.ID).update({
               price_end:price_end
            });
         }
         if(des != ''){
            database.ref('/item/'+mod_item.ID).update({
               description:des
            });
         }
         res.redirect('/mypage');
      }
   });
});

routes.get('/item_delete', function(req, res, next){
   var num = req.query.num;
   num = Number(num);
   database.ref('/item').once('value').then(function(snapshot){
      var check = (snapshot.val()) || 'Anonymous';
      var items = [];
      var len = Object.keys(check).length;
      var check_key = Object.keys(check);
      var cnt = 0;
      for(var i in check_key){
         if(check[check_key[i]].seller == mainID){
            check[check_key[i]].ID = check_key[i];
            items.push(check[check_key[i]]);
         }
      }
      var del_item = items[num];
      if(del_item.buyer != '' || del_item.like != '0'){
         res.send('<script>alert("You can not delete product after the bidding!"); window.history.back();;</script>');
      }
      else{
         database.ref('/item/'+del_item.ID).set(null);
         res.redirect('/mypage');
      }
   });
});

routes.get('/search', function(req, res, next){
   var ID = mainID;
   var keyword = req.query.word;
   keyword = keyword.toLowerCase();
   var cat =''
   if(req.query.cat){
      cat = req.query.cat;
   }
   var min = 0, max = 0, end = '';
   if(req.query.min && req.query.min != '') min = Number(req.query.min);
   if(req.query.max && req.query.max != '') max = Number(req.query.max);
   if(req.query.end && req.query.end != '') {
      console.log(req.query.end);
      end = req.query.end;
      end = new Date(Number(end.substring(0, 4)), Number(end.substring(5, 7)), Number(end.substring(8, 10)));
   }
   database.ref('/item/').once('value').then(function(snapshot){
      var item_info = (snapshot.val()) || '';
      var result1 = {}, result2 = {};
      var item_key = Object.keys(item_info);
      var added1 = [];
      var added2 = [];
      for(var i in item_key){
         var key = item_key[i];
         var item = item_info[item_key[i]];
         moment.tz.setDefault("Asia/Seoul");
         var cur_time = new moment().format('YYYY-MM-DD HH:mm:ss');
         var end_time = item_info[item_key[i]].end;
         var cmp_time = new Date(Number(end_time.substring(0, 4)), Number(end_time.substring(5, 7)), Number(end_time.substring(8, 10)));
         cur_time = new Date(Number(cur_time.substring(0, 4)), Number(cur_time.substring(5, 7)), Number(cur_time.substring(8, 10)), Number(cur_time.substring(11, 13)), Number(cur_time.substring(14,16)), Number(cur_time.substring(17,19)));
         end_time = new Date(Number(end_time.substring(0, 4)), Number(end_time.substring(5, 7)), Number(end_time.substring(8, 10)), Number(end_time.substring(11, 13)), Number(end_time.substring(14,16)), Number(end_time.substring(17,19)));
         if((end_time.getTime() - cur_time.getTime()) < 0) {
            continue;
         }
         if(end != '' && (end.getTime() - cmp_time.getTime()) < 0) {
            continue;
         }
         if(cat != '' && item_info[item_key[i]].category != cat) continue;
         if(min != 0 && item_info[item_key[i]].price < min) continue;
         if(max != 0 && item_info[item_key[i]].price > max) continue;
         var sec = (end_time.getTime() - cur_time.getTime())/1000;
         sec = Math.floor(sec);
         var minute = Math.max(Math.floor(sec/60), 0);
         sec = sec - minute*60;
         var hour = Math.max(Math.floor(minute/60),0);
         minute = minute - hour*60;
         var day = Math.max(Math.floor(hour/24), 0);
         hour = hour - day*24;
         var end_info = {};
         end_info['day'] = day;
         end_info['hour'] = hour;
         end_info['min'] = minute;
         end_info['sec'] = sec;
         for(var j in item){
            var tmp = item[j].toString().toLowerCase();
            if(j == 'buyer' || j == 'image') continue;
            if(j == 'seller' && tmp.includes(keyword) && !added2.includes(key)) {
               result2[key] = item;
               result2[key]['end_info'] = end_info;
               added2.push(key);
               continue;
            }
            if(j != 'seller' && tmp.includes(keyword) && !added1.includes(key)){
               result1[key] = item;
               result1[key]['end_info'] = end_info;
               added1.push(key);
               continue;
            }
         }
      }
      var result1_key = Object.keys(result1);
      var result2_key = Object.keys(result2);
      res.render('search', {rows:ID, result1:result1, result2:result2, result1_key:result1_key, result2_key:result2_key, keyword:keyword});
   });
});

routes.post('/mypage', function(req, res, next){
   writeID(req.body.name, mainID, req.body.password, req.body.phone, req.body.birth, req.body.email);
   res.send('<script>alert("Successed!"); window.location.href="/mypage";</script>');
});

routes.get('/cart', function(req, res, next){
   database.ref('/cart/'+mainID).once('value').then(function(snapshot){
      var check = (snapshot.val()) || 'Anonymous';
      if (check == 'Anonymous'){
         res.render('cart', {rows:mainID, items:'', items_key:''});
         return;
      }
      var itemID = check['itemID'];
      itemID = itemID.split('&');
      var item_price = check['price'];
      item_price = item_price.split('&');
      var items=[];
      var items_key = [];
      if(itemID.length > 0){
         var cnt = 0;
         for(var i in itemID){
            database.ref('/item/'+itemID[i]).once('value').then(function(snapshot){
               var single = (snapshot.val()) || 'Anonymous';
               single["your_price"] = item_price[cnt];
               single["url"] = '';
               moment.tz.setDefault("Asia/Seoul");
               var cur_time = new moment().format('YYYY-MM-DD HH:mm:ss');
               var end_time = single['end'];
               cur_time = new Date(Number(cur_time.substring(0, 4)), Number(cur_time.substring(5, 7)), Number(cur_time.substring(8, 10)), Number(cur_time.substring(11, 13)), Number(cur_time.substring(14,16)), Number(cur_time.substring(17,19)));
               end_time = new Date(Number(end_time.substring(0, 4)), Number(end_time.substring(5, 7)), Number(end_time.substring(8, 10)), Number(end_time.substring(11, 13)), Number(end_time.substring(14,16)), Number(end_time.substring(17,19)));
               var end_info = {};
               var sec = (end_time.getTime() - cur_time.getTime())/1000;
               if(sec > 0){
                  sec = Math.floor(sec);
                  var minute = Math.max(Math.floor(sec/60), 0);
                  sec = sec - minute*60;
                  var hour = Math.max(Math.floor(minute/60),0);
                  minute = minute - hour*60;
                  var day = Math.max(Math.floor(hour/24), 0);
                  hour = hour - day*24;
                  end_info['day'] = day;
                  end_info['hour'] = hour;
                  end_info['min'] = minute;
                  end_info['sec'] = sec;
               }
               else{
                  end_info['day'] = '0';
                  end_info['hour'] = '0';
                  end_info['min'] = '0';
                  end_info['sec'] = '0';
               }
               single['end_info'] = end_info;
               items.push(single);
               items_key.push(itemID[cnt]);
               cnt++;
               if (cnt==itemID.length) res.render('cart', {rows:mainID, items:items, items_key:items_key});
            });
         }
      }
      else{
         res.render('cart', {rows:mainID, items:items});
      }
   });
});

routes.get('/purchase', function(req, res, next){
   var ids = req.query.ids;
   ids = ids.split('&');
   database.ref('/cart/'+mainID).once('value').then(function(snapshot){
      var info = (snapshot.val()) || '';
      var info_itemID = info['itemID'];
      var info_price = info['price'];
      info_itemID = info_itemID.split('&');
      info_price = info_price.split('&');
      for(i in ids){
         var tmp = ids[i];
         var num = info_itemID.indexOf(tmp);
         console.log(num);
         info_itemID.splice(num, 1);
         info_price.splice(num, 1);
      }
      var new_itemID = '', new_price = '';
      for(i in info_itemID){
         if(i != 0){
            new_itemID = new_itemID + '&';
            new_price = new_price + '&';
         }
         new_itemID = new_itemID + info_itemID[i];
         new_price = new_price + info_price[i];
      }
      database.ref('/cart/'+mainID).set({
         itemID:new_itemID,
         price:new_price
      });
      res.redirect('/cart');
   });
});

routes.get('/like', function(req, res, next){
   var ID = mainID;
   var items = [];
   var items_key = [];
   database.ref('/like/'+ID).once('value').then(function(snapshot){
      var info = (snapshot.val()) || 'Anonymous';
      if(info == 'Anonymous'){
         res.render('like', {rows:ID, items:items, items_key:items_key});
      }
      else{
         info_key = Object.values(info);
         info_key = info_key[0];
         info_key = info_key.split('&');
         cnt = 0;
         for(var i in info_key){
            database.ref('/item/'+info_key[i]).once('value').then(function(snapshot){
               var item_info = (snapshot.val()) || 'Anonymous';
               item_info.ID = info_key[cnt];
               moment.tz.setDefault("Asia/Seoul");
               var cur_time = new moment().format('YYYY-MM-DD HH:mm:ss');
               var end_time = item_info['end'];
               cur_time = new Date(Number(cur_time.substring(0, 4)), Number(cur_time.substring(5, 7)), Number(cur_time.substring(8, 10)), Number(cur_time.substring(11, 13)), Number(cur_time.substring(14,16)), Number(cur_time.substring(17,19)));
               end_time = new Date(Number(end_time.substring(0, 4)), Number(end_time.substring(5, 7)), Number(end_time.substring(8, 10)), Number(end_time.substring(11, 13)), Number(end_time.substring(14,16)), Number(end_time.substring(17,19)));
               var end_info = {};
               var sec = (end_time.getTime() - cur_time.getTime())/1000;
               if(sec > 0){
                  sec = Math.floor(sec);
                  var minute = Math.max(Math.floor(sec/60), 0);
                  sec = sec - minute*60;
                  var hour = Math.max(Math.floor(minute/60),0);
                  minute = minute - hour*60;
                  var day = Math.max(Math.floor(hour/24), 0);
                  hour = hour - day*24;
                  end_info['day'] = day;
                  end_info['hour'] = hour;
                  end_info['min'] = minute;
                  end_info['sec'] = sec;
               }
               else{
                  end_info['day'] = '0';
                  end_info['hour'] = '0';
                  end_info['min'] = '0';
                  end_info['sec'] = '0';
               }
               item_info.end_info = end_info;
               items.push(item_info);
               items_key.push(info_key[cnt]);
               cnt += 1;
               if(cnt == info_key.length) {
                  res.render('like', {rows:ID, items:items, items_key:items_key});
               }
            });
         }
      }
   });
});

routes.get('/delete_like', function(req, res, next){
   var num = req.query.num;
   num = Number(num);
   //database.ref('/like/'+mainID+'/'+itemID).set(null);
   database.ref('/like/'+mainID).once('value').then(function(snapshot){
      var val = (snapshot.val()) || 'Anonymous';
      val = val['itemID'];
      val = val.split('&');
      var del_itemID = val[num];
      val.splice(num, 1);
      var new_val = '';
      for(var i in val){
         if(i != 0) new_val = new_val + '&';
         new_val = new_val + val[i];
      }
      if(new_val == ''){
         database.ref('/like/'+mainID).set(null);
      }
      else{
         database.ref('/like/'+mainID).set({
            itemID:new_val
         });
      }
      database.ref('/item/'+del_itemID).once('value').then(function(snapshot){
         var past_like = (snapshot.val()) || '';
         past_like = past_like['like'];
         past_like = Number(past_like) - 1;
         database.ref('/item/'+del_itemID).update({
            like:past_like
         });
         res.redirect('like');
      });
   });
   
});

routes.get('/delete_cart', function(req, res, next){
   var num = req.query.num;
   num = Number(num);
   database.ref('/cart/'+mainID).once('value').then(function(snapshot){
      var val = (snapshot.val()) || '';
      var val_itemID = val['itemID'];
      var val_price = val['price'];
      val_itemID = val_itemID.split('&');
      val_price = val_price.split('&');
      var itemID = val_itemID[num];
      database.ref('/item/'+itemID).once('value').then(function(snapshot){
         var item_info = (snapshot.val()) || '';
         moment.tz.setDefault("Asia/Seoul");
         var cur_time = new moment().format('YYYY-MM-DD HH:mm:ss');
         var end_time = item_info['end'];
         cur_time = new Date(Number(cur_time.substring(0, 4)), Number(cur_time.substring(5, 7)), Number(cur_time.substring(8, 10)), Number(cur_time.substring(11, 13)), Number(cur_time.substring(14,16)), Number(cur_time.substring(17,19)));
         end_time = new Date(Number(end_time.substring(0, 4)), Number(end_time.substring(5, 7)), Number(end_time.substring(8, 10)), Number(end_time.substring(11, 13)), Number(end_time.substring(14,16)), Number(end_time.substring(17,19)));
         if((end_time.getTime() - cur_time.getTime()) > 0){
            res.send('<script>alert("Bidding is not Finished!"); window.history.back();;</script>')
         }
         else{
            val_itemID.splice(num, 1);
            val_price.splice(num, 1);
            var new_itemID = '', new_price = '';
            for(var i in val_itemID){
               if(i != 0) {
                  new_itemID = new_itemID + '&';
                  new_price = new_price + '&';
               }
               new_itemID = new_itemID + val_itemID[i];
               new_price = new_price + val_price[i];
            }
            if(new_itemID == ''){
               database.ref('/cart/'+mainID).set(null);
            }
            else{
               database.ref('/cart/'+mainID).set({
                  itemID:new_itemID,
                  price:new_price
               });
            }
            res.redirect('/cart');
         }
      })
   })
});

routes.post('/account', function(req, res, next){
   var ID = mainID;
   database.ref('/users/'+ID).once('value').then(function(snapshot){
      var info = (snapshot.val()) || 'Anonymous';
      if(info.password == req.body.password){
         res.render('myaccount', {rows:ID, info:info});
      }
      else{
         res.send('<script>alert("Wrong password!"); window.location.href="/mypage";</script>');
         //res.redirect('/mypage');
      }
   });
   //res.render('myaccount', {rows:mainID});
});

routes.post('/upload', upload.single('image'), function(req, res, next){
   var ID = mainID;
   if(!req.body.name || !req.body.category || !req.body.location || !req.body.price_end || !req.body.description || !req.file){
      res.send('<script>alert("Please enter all information!"); window.location.href="/mypage";</script>');
   }
   else{
      var itemID = Math.random().toString(36).slice(2);
      var imgurl = 'https://firebasestorage.googleapis.com/v0/b/final-project-web-c6937.appspot.com/o/items%2F'+itemID+'.jpg?alt=media';
      var file = req.file;
      var bytes = new Uint8Array(file.buffer);
      var metadata = {
         contentType: 'image/jpeg',
       };
      var uploadTask = storageRef.child('items/'+itemID+'.jpg').put(bytes, metadata);
      uploadTask.on('state_changed', function(snapshot){
         // Observe state change events such as progress, pause, and resume
         // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
         var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
         console.log('Upload is ' + progress + '% done');
         switch (snapshot.state) {
           case firebase.storage.TaskState.PAUSED: // or 'paused'
             console.log('Upload is paused');
           case firebase.storage.TaskState.RUNNING: // or 'running'
             console.log('Upload is running');
         }
       }, function(error) {
         console.log(error)
       }, function() {
         uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL){
           console.log('File available at', downloadURL);
         });
       });
      var price;
      if(req.body.price) price = req.body.price;
      else price = '0';
      var cur_time = moment().add(7, 'd');
      cur_time = cur_time.format('YYYY-MM-DD HH:mm:ss');
      database.ref('item/'+itemID).set({
         name: req.body.name,
         category: req.body.category,
         location: req.body.location,
         price: price,
         price_end: req.body.price_end,
         description: req.body.description,
         seller: mainID,
         buyer: '',
         end: cur_time,
         image: imgurl,
         like: '0'
      });
      res.send('<script>alert("Upload Success!"); window.location.href="/mypage";</script>');
      
   }
});

routes.get('/admin', function(req, res, next){
   res.render('admin_login');
});

routes.post('/admin', function(req, res, next){
   if(!req.body.ID || !req.body.password) {
      res.send('<script>alert("Please Enter ID & Password!"); window.location.href="/admin";</script>')
   }
   else{
      var ID = req.body.ID;
      var password = req.body.password;
      database.ref('/admin').once('value').then(function(snapshot){
         var info = (snapshot.val()) || '';
         if(info['ID'] != ID){
            res.send('<script>alert("Incorrect ID!"); window.location.href="/admin";</script>')
         }
         else if(info['password'] != password){
            res.send('<script>alert("Incorrect Password!"); window.location.href="/admin";</script>')
         }
         else{
            adminID = ID;
            res.redirect('/admin_manage');
         }
      });
   }
});

routes.get('/admin_manage', function(req, res, next){
   if(adminID == '') res.send('<script>alert("No Authorization!"); window.location.href="/admin";</script>');
   else{
      var user_list = {};
      database.ref('/admin').once('value').then(function(snapshot){
         var admin_info = (snapshot.val()) || '';
         var admin_ID = admin_info['ID'];
         var admin_dic = {};
         admin_dic = {
            'name':admin_info['name'],
            'rate':admin_info['rate'],
            'type':'Admin',
            'phone':admin_info['phone'],
            'email':admin_info['email'],
            'birth':admin_info['birth']
         };
         user_list[admin_ID] = admin_dic;
         
         database.ref('/users').once('value').then(function(snapshot){
            var user_info = (snapshot.val()) || '';
            var user_ID = Object.keys(user_info);

            database.ref('/item').once('value').then(function(snapshot){
               var item_info = (snapshot.val()) || '';
               for(var i in user_ID){
                  user_info[user_ID[i]]['type'] = 'buyer';
                  for(var j in item_info){
                     if(user_ID[i] == item_info[j]['seller']){
                        user_info[user_ID[i]]['type'] = 'buyer/seller';
                        break;
                     }
                  }
               }
               for(var i in user_ID){
                  user_list[user_ID[i]] = user_info[user_ID[i]];
               }
               var user_list_key = Object.keys(user_list);
               //console.log(user_list);
               database.ref('/message').once('value').then(function(snapshot){
                  var msg_info = (snapshot.val()) || '';
                  var msg_info_key = Object.keys(msg_info);
                  var msg_list = {};
                  for(var k in msg_info_key){
                     var tmp = msg_info[msg_info_key[k]];
                     var tmp_type = tmp.type;
                     var tmp_title = tmp.title;
                     var tmp_msg = tmp.msg;
                     tmp_type = tmp_type.split('&');
                     tmp_title = tmp_title.split('&');
                     tmp_msg = tmp_msg.split('&');
                     var add_msg = {};
                     add_msg['type'] = tmp_type;
                     add_msg['title'] = tmp_title;
                     add_msg['msg'] = tmp_msg;
                     msg_list[msg_info_key[k]] = add_msg;
                  }
                  res.render('admin_manage', {user:user_list, user_key:user_list_key, msg_list:msg_list, msg_key:msg_info_key});
               });
            });
         });
      });
   }
});

routes.get('/admin_ban', function(req, res, next){
   var num = req.query.num;
   num = Number(num) - 1;
   database.ref('/users').once('value').then(function(snapshot){
      var info = (snapshot.val()) || '';
      var info_key = Object.keys(info);
      database.ref('/users/'+info_key[num]).set(null);
      var del_ID = info_key[num];
      var del_itemID = [];
      database.ref('/item').once('value').then(function(snapshot){
         var item_info = (snapshot.val()) || '';
         var item_info_key = Object.keys(item_info);
         for(var i in item_info_key){
            if(item_info[item_info_key[i]].seller == del_ID){
               database.ref('/item/'+item_info_key[i]).set(null);
               del_itemID.push(item_info_key[i]);
            }
         }
         for(var i in del_itemID){
            database.ref('/qna/'+del_itemID[i]).set(null);
         }
         cnt = 0;
         for(var k in del_itemID){
            database.ref('/like').once('value').then(function(snapshot){
               var like_info = (snapshot.val()) || '';
               var like_info_key = Object.keys(like_info);
               for(var i in like_info_key){
                  var like_itemID = like_info[like_info_key[i]].itemID;
                  if(like_itemID.includes(del_itemID[cnt])){
                     var tmp = like_itemID.split('&');
                     tmp.splice(tmp.indexOf(del_itemID[cnt]), 1);
                     var new_itemID='';
                     for(var j in tmp){
                        if(j!=0) new_itemID = new_itemID+'&';
                        new_itemID = new_itemID+tmp[j];
                     }
                     if(new_itemID != ''){
                        database.ref('/like/'+like_info_key[i]).set({
                           itemID:new_itemID
                        });
                     }
                     else{
                        database.ref('/like/'+like_info_key[i]).set(null);
                     }
                  }
               }
               cnt++;
            });
         }
         cnt2 = 0;
         for(var k in del_itemID){
            database.ref('/cart').once('value').then(function(snapshot){
               var cart_info = (snapshot.val()) || '';
               var cart_info_key = Object.keys(cart_info);
               for(var i in cart_info_key){
                  var cart_itemID = cart_info[cart_info_key[i]].itemID;
                  var cart_price = cart_info[cart_info_key[i]].price;
                  if(cart_itemID.includes(del_itemID[cnt2])){
                     var temp = cart_itemID.split('&');
                     var temp2 = cart_price.split('&');
                     temp.splice(temp.indexOf(del_itemID[cnt2]), 1);
                     temp2.splice(temp.indexOf(del_itemID[cnt2]), 1);
                     var new_cart_itemID = '', new_cart_price = '';
                     for(var j=0;j<temp.length;j++){
                        if(j != 0) {
                           new_cart_itemID = new_cart_itemID + '&';
                           new_cart_price = new_cart_price + '&';
                        }
                        new_cart_itemID = new_cart_itemID + temp[j];
                        new_cart_price = new_cart_price + temp2[j];
                     }
                     if(new_cart_itemID != ''){
                        database.ref('/cart/'+cart_info_key[i]).set({
                           itemID:new_cart_itemID,
                           price:new_cart_price
                        });
                     }
                     else{
                        database.ref('/cart/'+cart_info_key[i]).set(null);
                     }
                     
                  }
               }
               cnt2++;
            });
         }
      });
      
      res.redirect('/admin_manage');
   });

});

routes.get('/admin_modify', function(req, res, next){
   var num = req.query.num;
   num = Number(num) - 1;
   var rate, phone, email, birth;
   database.ref('/users').once('value').then(function(snapshot){
      var info = (snapshot.val()) || '';
      var info_key = Object.keys(info);
      if(req.query.rate && req.query.rate != '') {
         rate = req.query.rate;
         database.ref('/users/'+info_key[num]).update({
            rate:rate
         });
      }
      if(req.query.phone && req.query.phone != '') {
         phone = req.query.phone;
         database.ref('/users/'+info_key[num]).update({
            phone:phone
         });
      }
      if(req.query.email && req.query.email != ''){
         email = req.query.email;
         database.ref('/users/'+info_key[num]).update({
            email:email
         });
      }
      if(req.query.birth && req.query.birth != '') {
         birth = req.query.birth;
         database.ref('/users/'+info_key[num]).update({
            birth:birth
         });
      }
      res.redirect('/admin_manage');
   });
});

routes.get('/service', function(req, res, next){
   res.render('service', {rows:mainID});
});

routes.get('/message', function(req, res, next){
   var msg_type = req.query.type;
   var msg_title = req.query.title;
   var msg = req.query.message;
   database.ref('/message/'+mainID).once('value').then(function(snapshot){
      var info = (snapshot.val()) || '';
      var info_type = '', info_title = '', info_msg = '';
      var new_type = '', new_title = '', new_msg = '';
      if(info == ''){
         new_type = msg_type;
         new_title = msg_title;
         new_msg = msg;
      }
      else{
         info_type = info.type;
         info_title = info.title;
         info_msg = info.msg;
         new_type = info_type + '&' + msg_type;
         new_title = info_title + '&' + msg_title;
         new_msg = info_msg + '&' + msg;
      }
      database.ref('/message/'+mainID).set({
         type:new_type,
         title: new_title,
         msg:new_msg
      });
      res.redirect('/service');
   });
});

function writeID(name, ID, pw, phone, birth, email){
   database.ref('users/'+ID).set({
      name: name,
      password: pw,
      phone: phone,
      birth: birth,
      email: email,
      rate: '3',
   });
}

function cal_time(end){
   moment.tz.setDefault("Asia/Seoul");
   var cur = new moment().format('YYYY-MM-DD HH:mm:ss');
   cur = new Date(Number(cur.substring(0, 4)), Number(cur.substring(5, 7)), Number(cur.substring(8, 10)), Number(cur.substring(11, 13)), Number(cur.substring(14,16)));
   var end = new Date(Number(end.substring(0, 4)), Number(end.substring(5, 7)), Number(end.substring(8, 10)), Number(end.substring(11, 13)), Number(end.substring(14,16)));
   var min = (end.getTime() - cur.getTime())/60000;
   min = Math.floor(min);
   if(min<=0){
     return 0;
   }
   else if(min<60){
     min = min + 0.1;
     return min;
   }
   else {
     var hour = Math.floor(min/60);
     if(hour < 24){
       hour = hour + 0.2;
       return hour;
     }
     else{
       var day = Math.floor(hour/24);
       day = day + 0.3;
       return day;
     }
   }
 }

module.exports = routes;