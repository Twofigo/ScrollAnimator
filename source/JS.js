function setup(){
    var animator = scrollAnimator.newAnimator(document.getElementById("box"));
    var pLeft = animator.addAnimation("left", "distance");
    pLeft.addKeyframe(0,0);
    pLeft.addKeyframe(100,300);
    pLeft.addKeyframe(400,1500);
    pLeft.addKeyframe(10,6000);
    var bgColor = animator.addAnimation("backgroundColor", "color");
    bgColor.addKeyframe({r:0,g:0,b:255},0);
    bgColor.addKeyframe({r:0,g:255,b:255},100);
    bgColor.addKeyframe({r:255,g:0,b:0},3000);
    bgColor.addKeyframe({r:128,g:50,b:200},4000);
    
    for(d of document.getElementsByClassName("textbox")){
        var animator = scrollAnimator.newAnimator(d);
        var t = animator.addAnimation("marginLeft", "distance", "pt");
        t.setScreenRelation(1000);
        t.setAnchor(d);
        t.addKeyframe(0,0);
        t.addKeyframe(100,500);
        t.addKeyframe(0,1000);
        var t = animator.addAnimation("backgroundColor", "color");
        t.setScreenRelation(1000);
        t.setAnchor(d);
        t.addKeyframe({r:0,g:0,b:255},0);
        t.addKeyframe({r:0,g:255,b:0},500);
        t.addKeyframe({r:0,g:0,b:255},1000);
        var t = animator.addAnimation("width", "distance", "pt");
        t.setScreenRelation(1000);
        t.setAnchor(d);
        t.addKeyframe(400,0);
        t.addKeyframe(600,400);
        t.addKeyframe(400,1000);
    }
    
    scrollAnimator.init();
}

var scrollAnimator = (function(){

    var animators = [];
    
    var syntaxFunctions = {};
    syntaxFunctions.distance = function(value, dom, attribute, unit = "px"){
        dom.style[attribute]= value+unit;
    }
    syntaxFunctions.color = function(value, dom, attribute, unit){
        if(!value.a)value.a=1;
        dom.style[attribute]= "rgba("+value.r+","+value.g+","+value.b+","+value.a+")";
    }
    syntaxFunctions.Offset_vertical = function(value, dom, attribute, unit){
        syntaxFunctions.distance(dom, attribute+"Top", value);
        syntaxFunctions.distance(dom, attribute+"Bottom", -value);
    }
    syntaxFunctions.Offset_horizontal = function(value, dom, attribute, unit){
        syntaxFunctions.distance(dom, attribute+"Left", value);
        syntaxFunctions.distance(dom, attribute+"Right", -value);
    }
    syntaxFunctions.Offset_pair = function(value, dom, attribute, unit){
        syntaxFunctions.margin_offset_horizontal(value.x, dom, attribute, unit);
        syntaxFunctions.margin_offset_vertical(value.y, dom, attribute, unit);
    }
    
    var transissions = {};
    transissions.linear = function(timeStamp){
        return timeStamp;
    }
    transissions.constant = function(timeStamp){
        return 0;
    }
    
    var init = function(){
       window.addEventListener('scroll', update)
 
    }
    
    var update = function(){
        for (a of animators){
            a.update(document.body.scrollTop);
        }
    }
    
    var newAnimator = function(dom){
        var animator = new Animator(dom);
        animators.push(animator)
        return animator;
    }

    var Animator = function(dom){
       this.dom = dom;
       this.animations = [];
    }
    Animator.prototype.clone = function(){
       var t = new Animator(this.dom);
       for (a of this.animations){
            t.add(a.clone())
       }
       return t;
    }
    Animator.prototype.addAnimation = function(attribute, syntax, unit){     
        var animation = new Animation(attribute, syntax, unit);
        this.animations.push(animation);
        return animation;
    }
    Animator.prototype.update = function(timeStamp){
        for (a of this.animations){
            a.update(this.dom, timeStamp)
        }
    }
    
    var Animation = function(attribute, syntax, unit){
        this.attribute = attribute;
        this.keyframes = [];
        this.syntax = syntax;
        this.unit = unit;
        
        this.screenRelation = false;
        this.anchor = false;
        
        this._keyframe;
        this._valueDiff;
        this._timeDiff;
    }
    Animation.prototype.setAnchor = function(dom){
        this.anchor = dom;
    }
    Animation.prototype.setScreenRelation = function(valuePerScreenHeight){
        if (valuePerScreenHeight === false){
            this.screenRelation = false;
        }
        else if (valuePerScreenHeight === true){
            this.screenRelation = 1000;
        }
        else{
            this.screenRelation = valuePerScreenHeight;
        }
    }
    Animation.prototype.clone = function(){
       var t = new Animation(this.cssAttribute);
       t.syntaxFunction = this.syntaxFunction;
       for(k in this.keyframe){
            t.addKeyframe(k.clone());
       }
       return t;
    }
    Animation.prototype.addKeyframe = function(value, timeStamp, transission = "linear"){
        var keyframe = new Keyframe(value, timeStamp, transission)
        this.keyframes.push(keyframe);
        this.keyframes.sort(function(a,b){return a.timeStamp - b.timeStamp});
        return keyframe;
    }
    Animation.prototype.update = function(dom, timeStamp){
        
        if (this.anchor){
            timeStamp-= this.anchor.getBoundingClientRect().top;
        }
    
        if(this.screenRelation){
           var f = this.screenRelation/window.innerHeight;
           timeStamp*= f;
        }
        
        
        if(!this._keyframe || this._keyframe.timeStamp>timeStamp || (this._keyframe.timeStamp+this._timeDiff)<timeStamp){
            var last_keyframe = false;
            var next_keyframe = false;
            for(k of this.keyframes){
                if (k.timeStamp > timeStamp){
                    if(!last_keyframe)last_keyframe = k
                    else next_keyframe = k;
                    break;
                }
                last_keyframe = k;
            }
            this._keyframe = last_keyframe;
            if  (next_keyframe){
                this._timeDiff = next_keyframe.timeStamp - last_keyframe.timeStamp;
                
                if (!isFinite(this._keyframe.value)){
                    this._valueDiff = {};
                    for(key in this._keyframe.value){
                        this._valueDiff[key] = next_keyframe.value[key] - last_keyframe.value[key];
                    }
                }
                else{
                     this._valueDiff = next_keyframe.value - last_keyframe.value;
                }
            }
            else{
                this._valueDiff = false;
                this._timeDiff = false;
            }
        }
        
        var v;
            
        if (this._valueDiff){
            var factor = this._keyframe.transission((timeStamp-this._keyframe.timeStamp)/this._timeDiff);
            
            if (!isFinite(this._keyframe.value)){
                v = {};
                for(key in this._keyframe.value){
                    v[key] = this._valueDiff[key]*factor;
                    v[key] += this._keyframe.value[key];
                }
            }
            else{
                 v = this._valueDiff*factor;
                 v += this._keyframe.value;
            }
        }
        else{
            v = this._keyframe.value;
        }    
        
        syntaxFunctions[this.syntax](v, dom, this.attribute, this.unit);
    }
    
    var Keyframe = function(value, timeStamp, transission = "linear"){
        this.value = value;
        this.timeStamp = timeStamp;
        this.transission = transissions[transission];
    }
    Keyframe.prototype.clone = function(){
       var t = new Keyframe(value, timeStamp, this.transissionFunc);
       return t;
    }
    
    return {
        init: init,
        animators: animators,
        newAnimator: newAnimator,
    };
})();