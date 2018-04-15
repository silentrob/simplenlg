/*
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is "Simplenlg".
 *
 * The Initial Developer of the Original Code is Ehud Reiter, Albert Gatt and Dave Westwater.
 * Portions created by Ehud Reiter, Albert Gatt and Dave Westwater are Copyright (C) 2010-11 The University of Aberdeen. All Rights Reserved.
 *
 * Contributor(s): Ehud Reiter, Albert Gatt, Dave Wewstwater, Roman Kutlak, Margaret Mitchell.
 */


import {isArray} from 'lodash';
import LexicalCategory from '../features/LexicalCategory';

class Element {
  constructor() {
    this.realisation = null;
    this.category = null;
    this.features = {};
  }

  isPlural(){
    return 'PLURAL' == this.getFeature('NUMBER');
  }

  setFeature(newFeature, value){
    // if (newFeature == "ignore_modal"){
    //   throw new Error();
    // }
    this.features[newFeature.toUpperCase()] = value;
  }

  removeFeature(featureName){
    delete this.features[featureName.toUpperCase()];
  }

  // string version
  equals(elementRealisation){
    let match = false;

    if (elementRealisation == null && this.realisation == null) {
      match = true;
    } else if (elementRealisation != null && this.realisation != null) {
      match = elementRealisation == this.realisation;
    }
    return match;
  }

  getFeature(featureName){
    let feat = this.features[featureName.toUpperCase()];
    return feat || null;
  }

  getAllFeatures(){
    return this.features;
  }

  hasFeature(featureName){
    return (this.features[featureName.toUpperCase()] !== undefined) ? true : false;
  }

  setCategory(newCategory){
    this.category = newCategory;
  }

  getCategory(){
    return (this.category) ? this.category : null;
  }

  setParent(newParent){
    this.parent = newParent;
  }

  getParent(){
    return this.parent;
  }

  getRealisation(){
    return this.realisation;
  }


  getFeatureAsElement(featureName){
    let value = this.getFeature(featureName);
    let elementValue = null;

    if (value instanceof Element){
      elementValue =  value;
    } else if (typeof value === "string" && value !== ""){
      elementValue = new StringElement(value)
    }
    return elementValue;
  }

  getFeatureAsBoolean(featureName){

    return (this.getFeature(featureName.toUpperCase()) === true) ? true : false;
  }

  getAllFeatureNames(){
    return Object.keys(this.features) || [];
  }

  getFeatureAsString(featureName){
    let value = this.getFeature(featureName);
    let stringValue = null;

    if (value != null) {
      stringValue = value;
    }
    return stringValue;
  }

  getFeatureAsElementList(featureName){
    let list = [];
    let value = this.getFeature(featureName);

    if (value instanceof Element){
      list.push(value);
    } else if (value instanceof Array){
      for (let i = 0; i < value.length; i++){
        if (value[i] instanceof Element){
          list.push(value[i]);
        }
      }
    }
    return list;
  }

  setRealisation(realisation){
    this.realisation = realisation;
  }

  setPlural(isPlural){
    if (isPlural){
      this.setFeature('NUMBER', 'PLURAL');
    } else {
      this.setFeature('NUMBER', 'SINGULAR');
    }
  }

  getChildren(){
    console.log("Abstract Method, missing getChildren found", this);
  }

  isA(checkCategory){
    let isA = false;

    if (this.category != null) {
      isA = this.category == checkCategory;
    } else if (checkCategory == null) {
      isA = true;
    }
    return isA;
  }


  toString(){
    let buffer = "{realisation=" + this.realisation;

    if (this.category != null){
      buffer += ", category=" + this.category;
    }

    if (this.features != null){
      buffer += ", features={";
      let features = this.getAllFeatures();
      for (let eachFeature in features){
        if (isArray(features[eachFeature])){
          buffer += eachFeature + "=" + features[eachFeature].map(function(each){ return each.toString() + " "; });
        } else {
          buffer += eachFeature + "=" + features[eachFeature] + " ";  
        }
      }
      buffer += '}';
    }

    buffer += '}';
    return buffer;
  }

  printTree(indent){
    let thisIndent = indent == null ? " |-" : indent + " |-";
    let childIndent = indent == null ? " |-" : indent + " |-";
    let print = "Element: \n";

    let children = this.getChildren();

    if (children != null) {
      for (var i = 0; i < children.length; i++){
        let eachChild = children[i];
        print += thisIndent + eachChild.printTree(childIndent);
      }
    }
    return print;
  }
}

// This is super weaksauce, because of how import/require works, we can not create a 
// circular dependancy. For now, Ive duplicated this class here.
class StringElement extends Element {
  constructor(value){
    super();
    this.setCategory('CANNED_TEXT');
    this.setFeature('ELIDED', false);
    this.setRealisation(value);
  }

  getChildren(){
    return [];
  }

  toString() {
    return this.getRealisation();
  }

  printTree(indent){
    let print = "";
    print += "StringElement: content=\"";
    print += this.getRealisation() + '\"';
    
    let features = this.getAllFeatures();

    if (features != null) {
      print += ", features=";
      print += JSON.stringify(features);
    }
    print += '\n';
    return print;
  }
}

export {Element, StringElement};
