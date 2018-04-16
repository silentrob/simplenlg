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


const fs = require('fs');
const parse = require('xml-parser');
const S = require('string');
const path = require('path');

import HashMap from 'hashmap';
import WordElement from '../framework/wordElement'

import LexicalCategory from '../features/LexicalCategory';

const LexicalFeature = {
  PLURAL: Symbol('PLURAL'),
  COMPARATIVE: Symbol('COMPARATIVE'),
  SUPERLATIVE: Symbol('SUPERLATIVE'),
  PRESENT3S: Symbol('PRESENT3S'),
  PAST: Symbol('PAST'),
  PAST_PARTICIPLE: Symbol('PAST_PARTICIPLE'),
  PRESENT_PARTICIPLE: Symbol('PRESENT_PARTICIPLE'),
}

const Inflection = {
  REGULAR: 'REGULAR',
  IRREGULAR: 'IRREGULAR',
  REGULAR_DOUBLE: 'REGULAR_DOUBLE',
  GRECO_LATIN_REGULAR: 'GRECO_LATIN_REGULAR',
  UNCOUNT: 'UNCOUNT',
  INVARIANT: 'INVARIANT',
};

let getInflCode = function(code){
  code = code.toLowerCase().trim();
  let infl = null;
  if (code == "reg") {
    infl = Inflection.REGULAR;
  } else if (code == "irreg") {
    infl = Inflection.IRREGULAR;
  } else if (code == "regd") {
    infl = Inflection.REGULAR_DOUBLE;
  } else if (code == "glreg") {
    infl = Inflection.GRECO_LATIN_REGULAR;
  } else if (code == "uncount" || code == "noncount" || code == "groupuncount") {
    infl = Inflection.UNCOUNT;
  } else if (code == "inv") {
    infl = Inflection.INVARIANT;
  }

  return infl;
}

let getVariants = function(word){
  let variants = new Set();

  variants.add(word.getBaseForm());

  switch(word.getCategory()){
    case LexicalCategory.NOUN:
      variants.add(getVariant(word, "PLURAL", "s"));
      break;
    case LexicalCategory.ADJECTIVE:
      variants.add(getVariant(word, "COMPARATIVE", "er"));
      variants.add(getVariant(word, "SUPERLATIVE", "est"));
      break;
    case LexicalCategory.VERB:
      variants.add(getVariant(word, "PRESENT3S", "s"));
      variants.add(getVariant(word, "PAST", "ed"));
      variants.add(getVariant(word, "PAST_PARTICIPLE", "ed"));
      variants.add(getVariant(word, "PRESENT_PARTICIPLE", "ing"));
      break;
  }

  return variants;
};

let getVariant = function(word, feature, suffix){
  if (word.hasFeature(feature)){
    return word.getFeature(feature);
  } else {
    return getForm(word.getBaseForm(), suffix);
  }
};

let getForm = function(base, suffix){
  // add a suffix to a base form, with orthographic changes

  // rule 1 - convert final "y" to "ie" if suffix does not start with "i"
  // eg, cry + s = cries , not crys
  if (S(base).endsWith("y") && !S(suffix).startsWith("i"))
    base = base.substring(0, base.length - 1) + "ie";

  // rule 2 - drop final "e" if suffix starts with "e" or "i"
  // eg, like+ed = liked, not likeed
  if (S(base).endsWith("e") && (S(suffix).startsWith("e") || S(suffix).startsWith("i")))
    base = base.substring(0, base.length - 1);

  // rule 3 - insert "e" if suffix is "s" and base ends in s, x, z, ch, sh
  // eg, watch+s -> watches, not watchs
  if (S(suffix).startsWith("s") && (S(base).endsWith("s") || S(base).endsWith("x") || S(base).endsWith("z") || S(base).endsWith("ch") || S(base).endsWith("sh")))
    base = base + "e";

  // have made changes, now append and return
  return base + suffix; // eg, want + s = wants
}

class Lexicon {
  constructor(lexiconName = "default-lexicon.xml"){

    const p = path.join(__filename, '../../../');
    this.xml = fs.readFileSync(`${p}/data/${lexiconName}`, 'utf8');
  
    this.words = new Set();
    this.indexByID = new HashMap(); // map from ID to word
    this.indexByBase = {}; // map from base to set of words with this baseform
    this.indexByVariant = {}; // map from variants
    this.indexByCategory = {}; // map from category
 
    let obj = parse(this.xml);
    let wordNodes = obj.root.children;
    let words = new HashMap();

    for (let i = 0; i < wordNodes.length; i++){
      let wordNode = wordNodes[i];

      let word = this.convertNodeToWord(wordNode);

      if (word != null) {
        this.words.add(word);
        this.indexWord(word);
      }
    }

    this.addSpecialCases();
  }

  convertNodeToWord(wordNode){
    let word = new WordElement();
    let inflections = [];

    for (let n = 0; n < wordNode.children.length; n++){
      let feature = wordNode.children[n]['name'];
      let value = wordNode.children[n]['content'];

      if (value != undefined){
        value = value.trim();
      }

      if (feature === null){
        console.log("ERROR - Feature is null", wordNode);
      }

      if (feature === "base"){
        word.setBaseForm(value);
      } else if (feature == "category"){
        word.setCategory(LexicalCategory.enumValueOf(value.toUpperCase()));
      } else if (feature == "id"){
        word.setId(value);
      } else if (value == null || value == ""){
        // if this is an infl code, add it to inflections
        let infl = getInflCode(feature);
        if (infl != null){
          inflections.push(infl);
        } else {

          word.setFeature(feature, true);  
        }
      } else {
        // These two don't map correctly from the XML doc to the feature name.
        if (feature == "pastParticiple"){
          word.setFeature('PAST_PARTICIPLE', value);  
        } else if (feature == "presentParticiple"){
          word.setFeature('PRESENT_PARTICIPLE', value);
        } else {
         word.setFeature(feature, value); 
        }
      }
    }

    // if no infl specified, assume regular
    if (inflections.length == 0) {
      inflections.push(Inflection.REGULAR);
    }

    // default inflection code is "reg" if we have it, else random pick form infl codes available
    let defaultInfl = inflections.indexOf(Inflection.REGULAR) > 0 ? Inflection.REGULAR : inflections[0];   
    
    word.setFeature('DEFAULT_INFL', defaultInfl);
    word.setDefaultInflectionalVariant(defaultInfl);
    
    for(let infl = 0;  infl < inflections.length; infl++) {
      word.addInflectionalVariant(inflections[infl]);
    }
    return word;
  }

  indexWord(word){
    // first index by base form
    let base = word.getBaseForm();
    // shouldn't really need is, as all words have base forms
    if (base != null) {
      this.updateIndex(word, base, this.indexByBase);
    }

    // now index by ID, which should be unique (if present)
    let id = word.getId();
    if (id != null) {
      if (this.indexByID.has(id)){
        console.log(`Lexicon error: ID ${id} occurs more than once`);
      }
      this.indexByID.set(id, word);
    }

    // now index by variant
    
    for (let variant of getVariants(word)){
      this.updateIndex(word, variant, this.indexByVariant);
    }

    let category = word.getCategory();
    this.updateIndex(word, category.name, this.indexByCategory);
  
    // done
  }

  updateIndex(word, base, index){
    if (index[base] === undefined){
      index[base] = [];
    }
    index[base].push(word);
  }

  addSpecialCases(){
    // add variants of "be"
    let be = this.getWord("be", LexicalCategory.VERB);
    if (be != null) {
      this.updateIndex(be, "is", this.indexByVariant);
      this.updateIndex(be, "am", this.indexByVariant);
      this.updateIndex(be, "are", this.indexByVariant);
      this.updateIndex(be, "was", this.indexByVariant);
      this.updateIndex(be, "were", this.indexByVariant);
    }
  }

  createWord(baseForm, category){
    return new WordElement(baseForm, category);
  }

  // Getters

  getRandomWord(category = LexicalCategory.ANY){

    if (category == LexicalCategory.ANY){
      let max = Object.keys(this.indexByBase).length;
      let pos = Math.floor(Math.random() * max);
      let word = Object.keys(this.indexByBase)[pos];
      return this.indexByBase[word];
    } else {
      category =  (category instanceof LexicalCategory) ? category.name : category;
      let max = this.indexByCategory[category].length;
      let pos = Math.floor(Math.random() * max);
      return this.indexByCategory[category][pos];
    }
  }

  // convenience method
  getWord(baseForm, category){
    let wordElements = this.getWords(baseForm, category);
    
    if (wordElements.length == 0){
      return this.createWord(baseForm, category); // return default WordElement
    } else {
      // of this baseForm, category
      return this.selectMatchingWord(wordElements, baseForm);
    }
  }

  lookupWord(baseForm, category = "ANY"){
    if (this.hasWord(baseForm, category)){
      return this.getWord(baseForm, category);
    } else if (this.hasWordFromVariant(baseForm, category)){
      return this.getWordFromVariant(baseForm, category);
    } else if (this.hasWordByID(baseForm)){
      return this.getWordByID(baseForm);
    } else{
      return this.createWord(baseForm, category);
    }
  }

  selectMatchingWord(wordElements, baseForm){
        
    // below check is redundant, since caller should check this
    if (wordElements == null || wordElements.length == 0)
      return this.createWord(baseForm);
    
    // look for exact match in base form
    for (var i = 0; i < wordElements.length; i++){
      let wordElement = wordElements[i];
      if (wordElement.getBaseForm() == baseForm){
        return wordElement;
      }
    }
    
    if(wordElements[0].getBaseForm().toLowerCase() == baseForm.toLowerCase()) {
      return this.createWord(baseForm, LexicalCategory.ANY);
    }
    
    return wordElements[0];
  }


  getWords(baseForm, category){
    category = (category instanceof LexicalCategory) ? category.name : category;
    return this.getWordsFromIndex(baseForm, category, this.indexByBase);
  }

  getWordFromVariant(variant, category){
    category = (category instanceof LexicalCategory) ? category.name : category;
    let wordElements = this.getWordsFromVariant(variant, category);
    if (wordElements.length === 0){
      return this.createWord(variant, category);
    } else {
      return this.selectMatchingWord(wordElements, variant);
    }
  }

  getWordsFromIndex(indexKey, category, indexMap){
    let result = [];
    category = (category instanceof LexicalCategory) ? category.name : category;

    // case 1: unknown, return empty list
    if (!indexMap[indexKey]) {
      return result;
    }
    
    // case 2: category is ANY, return everything
    if (category == LexicalCategory.ANY) {
      return indexMap[indexKey];
    } else {
      // case 3: other category, search for match
      let words = indexMap[indexKey];
      for (let i = 0; i < words.length; i++){
        if (words[i].getCategory() == category) {
          result.push(words[i]);
        }
      }
    } 
    return result;
  }

  getWordsFromVariant(variant, category){
    category =  (category instanceof LexicalCategory) ? category.name : category;
    return this.getWordsFromIndex(variant, category, this.indexByVariant);
  }

  getWordsByID(id){
    let result = [];
    if (this.indexByID.has(id)) {
      result.push(this.indexByID.get(id));
    }
    return result;
  }

  hasWord(baseForm, category){
    category =  (category instanceof LexicalCategory) ? category.name : category;
    let result = this.getWords(baseForm, category);
    return !(result.length === 0);
  }

  hasWordFromVariant(variant, category){
    category =  (category instanceof LexicalCategory) ? category.name : category;
    let result = this.getWordsFromVariant(variant, category);
    return !(result.length === 0);
  }

  hasWordByID(id){
    let result = this.getWordsByID(id);
    return !(result.length === 0);
  }

}


export default Lexicon;
