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


import Element from './element'
import LexicalCategory from '../features/LexicalCategory';

class InflectionSet {

  constructor(infl) {
    this.infl = infl;
    this.forms = {}
  }

  addForm(feature, form) {
    this.forms[feature] = form;
  }

  getForm(feature) {
    return this.forms[feature];
  }
}

// These are elements from the lexicon.

class WordElement extends Element {
  constructor(value, category = LexicalCategory.ANY){

    // Force the category to ENUM value
    if (!(category instanceof LexicalCategory)){
      category = LexicalCategory.enumValueOf(category.toUpperCase());
    }

    if(typeof value !== "string" && value !== undefined){
      console.log("\n\nWE HAVE AN ISSUES HERE\n", value);
      throw new Error("Value IS NOT string")
    }

    super();
    this.setCategory(category);
    this.baseForm = value;
    this.id = null;
    this.inflVars = {};
    this.defaultInfl = null;
  }

  getInflectionalFeatures(cat){
    if (cat == 'NOUN_PHRASE' || cat == 'NOUN'){
      return ['PLURAL'] ;
    } else if (cat == 'VERB_PHRASE' || cat == 'VERB'){
      console.log('WordElement - getInflectionalFeatures Finish')
      throw new Error("FINISH THIS");
      return ['PAST', 'PAST_PARTICIPLE', 'PRESENT_PARTICIPLE', 'PRESENT3S'];
    } else if (cat == 'ADJECTIVE_PHRASE' || cat == 'ADJECTIVE'){
      return ['COMPARATIVE', 'SUPERLATIVE'];
    } else {
      return null;
    }
  }

  getId(){
    return this.id;
  }

  getBaseForm(){
    return this.baseForm;
  }

  setBaseForm(baseForm){
    this.baseForm = baseForm;
  }

  setId(id){
    this.id = id;
  }

  getChildren(){
    return [];
  }

  addInflectionalVariant(infl, lexicalFeature, form){    
    if (this.inflVars[infl]) {
      this.inflVars[infl].addForm(lexicalFeature, form);
    } else {
      let set = new InflectionSet(infl);
      set.addForm(lexicalFeature, form);
      this.inflVars[infl] = set;
    }
  }

  setDefaultInflectionalVariant(variant){
    this.setFeature('DEFAULT_INFL', variant);
    this.defaultInfl = variant;

    if (this.inflVars[variant]){
      let set = this.inflVars[variant];
      let forms = this.getInflectionalFeatures(this.getCategory());
      if (forms != null) {
        for (let x = 0; x < forms.length; x++) {
          this.setFeature(forms[x], set.getForm(x));
        }
      }
    }
  }

  getDefaultSpellingVariant(){
    let defSpell = this.getFeatureAsString('DEFAULT_SPELL');
    return defSpell == null ? this.getBaseForm() : defSpell;
  }

  printTree(indent) {
    let cat = (this.getCategory() instanceof LexicalCategory) ? this.getCategory().name : this.getCategory();

    let print = "WordElement: base=";
    print += this.getBaseForm();
    print += ", category=" + cat;
    print += ", " + super.toString();
    print += "\n"
    return print;
  }

  toString(){
    let _category = (this.getCategory() instanceof LexicalCategory) ? this.getCategory().name : this.getCategory();
    let buffer = "WordElement[" + this.getBaseForm() + ":";
    
    if (_category != null) {

      buffer += _category;
    } else {
      buffer += "no category";
    }
    buffer += ']';
    return  buffer;
  }
}

export default WordElement;
