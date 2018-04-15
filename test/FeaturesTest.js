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


import Lexicon from '../src/lexicon/lexicon';
import NPPhraseSpec from '../src/phraseSpec/NPPhraseSpec';
import Realiser from '../src/realiser/Realiser';

import StringElement from '../src/framework/stringElement';
import WordElement from '../src/framework/wordElement';
import InflectedWordElement from '../src/framework/inflectedWordElement';
import PhraseElement from '../src/framework/phraseElement';
import CoordinatedPhraseElement from '../src/framework/coordinatedPhraseElement';
import NLG from '../src/framework/nlg';

import NumberAgreement from '../src/features/NumberAgreement';
import Feature from '../src/features/Feature';
import Gender from '../src/features/Gender';
import LexicalFeature from '../src/features/LexicalFeature';
import Person from '../src/features/Person';
import InternalFeature from '../src/features/InternalFeature';
import Tense from '../src/features/Tense';

import LexicalCategory from '../src/features/LexicalCategory';

import mocha from 'mocha';
import should from 'should/as-function';

const lexicon = new Lexicon('small-lexicon.xml');
const nlg = new NLG(lexicon);
const realiser = new Realiser(lexicon);


describe('FeatureTest', () => { 

  it("testPossessiveFeature_PastTense", (done) => {
    
    // Create the pronoun 'she'
    let she = nlg.createWord("she", LexicalCategory.PRONOUN);

    // Set possessive on the pronoun to make it 'her'
    she.setFeature(Feature.POSSESSIVE, true);

    // Create a noun phrase with the subject lover and the determiner as she
    let herLover = nlg.createNounPhrase(she, "lover");

    // Create a clause to say 'he be her lover'
    let clause = nlg.createClause("he", "be", herLover);

    // Add the cue phrase need the comma as orthography
    // currently doesn't handle 
    // This could be expanded to be a noun phrase with determiner
    // 'two' and noun 'week', set to plural and with a premodifier of
    // 'after'
    clause.setFeature(Feature.CUE_PHRASE, "after two weeks,");

    // Add the 'for a fortnight' as a post modifier. Alternatively
    // this could be added as a prepositional phrase 'for' with a
    // complement of a noun phrase ('a' 'fortnight')
    clause.addPostModifier("for a fortnight");

    // Set 'be' to 'was' as past tense
    clause.setFeature(Feature.TENSE,Tense.PAST);

    // Add the clause to a sentence.
    let sentence1 = nlg.createSentence(clause);

    // console.log(sentence1.printTree());
    // Realise the sentence
    should(realiser.realise(sentence1).getRealisation()).eql("After two weeks, he was her lover for a fortnight.");

    done();
  });


  /**
   * Basic tests.
   */
  it("testTwoPossessiveFeature_PastTense", (done) => {

    // let she = nlg.createWord("she", LexicalCategory.PRONOUN);
    // let herLover = nlg.createNounPhrase(she, "lover");
    // herLover.setPlural(true);

    // she.setFeature(Feature.POSSESSIVE, true);
    // let he = nlg.createNounPhrase(LexicalCategory.PRONOUN, "he");
    // he.setPlural(true);
    // let clause = nlg.createClause(he, "be", herLover);
    // clause.setFeature(Feature.POSSESSIVE, true);
    // clause.setFeature(Feature.TENSE, Tense.PAST);
    // let sentence1 = nlg.createSentence(clause);

    // // console.log(sentence1.printTree());
    // console.log(realiser.realise(sentence1).getRealisation(),  "they were her lovers");

    // Create the pronoun 'she'
    let she = nlg.createWord("she", LexicalCategory.PRONOUN);

    // Set possessive on the pronoun to make it 'her'
    she.setFeature(Feature.POSSESSIVE, true);

    // Create a noun phrase with the subject lover and the determiner as she
    let herLover = nlg.createNounPhrase(she, "lover");
    herLover.setPlural(true);

    // Create the pronoun 'he'
    let he = nlg.createNounPhrase(LexicalCategory.PRONOUN, "he");
    he.setPlural(true);

    // Create a clause to say 'they be her lovers'
    let clause = nlg.createClause(he, "be", herLover);
    clause.setFeature(Feature.POSSESSIVE, true);

    // Add the cue phrase need the comma as orthography
    // currently doesn't handle 
    // This could be expanded to be a noun phrase with determiner
    // 'two' and noun 'week', set to plural and with a premodifier of
    // 'after'
    clause.setFeature(Feature.CUE_PHRASE, "after two weeks,");

    // Add the 'for a fortnight' as a post modifier. Alternatively
    // this could be added as a prepositional phrase 'for' with a
    // complement of a noun phrase ('a' 'fortnight')
    clause.addPostModifier("for a fortnight");

    // Set 'be' to 'was' as past tense
    clause.setFeature(Feature.TENSE, Tense.PAST);


    // Add the clause to a sentence.
    let sentence1 = nlg.createSentence(clause);
    should(realiser.realise(sentence1).getRealisation()).eql("After two weeks, they were her lovers for a fortnight.");
    done();
  });

  /**
   * Test use of the Complementiser feature by combining two S's using cue phrase and gerund.
   */
  it("testComplementiserFeature_PastTense", (done) => {

    let born = nlg.createClause("Dave Bus", "be", "born");
    born.setFeature(Feature.TENSE,Tense.PAST);
    born.addPostModifier("in");
    born.setFeature(Feature.COMPLEMENTISER, "which");

    let theHouse = nlg.createNounPhrase("the", "house");
    theHouse.addComplement(born);

    let clause = nlg.createClause(theHouse, "be", nlg.createPrepositionPhrase("in", "Edinburgh"));
    let sentence = nlg.createSentence(clause);

    should(realiser.realise(sentence).getRealisation()).eql("The house which Dave Bus was born in is in Edinburgh.");
    done();
  });
  
  /**
   * Test use of the Complementiser feature in a {@link CoordinatedPhraseElement} by combine two S's using cue phrase and gerund.
   */
  it("testComplementiserFeatureInACoordinatePhrase_PastTense", (done) => {


    let dave = nlg.createWord("Dave Bus", LexicalCategory.NOUN);
    let albert = nlg.createWord("Albert", LexicalCategory.NOUN);
    
    let coord1 = new CoordinatedPhraseElement(dave, albert);
    
    let born = nlg.createClause(coord1, "be", "born");
    born.setFeature(Feature.TENSE,Tense.PAST);
    born.addPostModifier("in");
    born.setFeature(Feature.COMPLEMENTISER, "which");

    let theHouse = nlg.createNounPhrase("the", "house");
    theHouse.addComplement(born);

    let clause = nlg.createClause(theHouse, "be", nlg.createPrepositionPhrase("in", "Edinburgh"));
    let sentence = nlg.createSentence(clause);

    should(realiser.realise(sentence).getRealisation()).eql("The house which Dave Bus and Albert were born in is in Edinburgh.");

    done();
  });

  /**
   * Test the use of the Progressive and Complementiser Features in future tense.
   */
  it("testProgressiveAndComplementiserFeatures_FutureTense", (done) => {

    // Inner clause is 'I' 'make' 'sentence' 'for'.
    let inner = nlg.createClause("I", "make", "sentence for");
    
    // Inner clause set to progressive.
    inner.setFeature(Feature.PROGRESSIVE,true);

    //Complementiser on inner clause is 'whom'
    inner.setFeature(Feature.COMPLEMENTISER, "whom");
    
    // create the engineer and add the inner clause as post modifier 
    let engineer = nlg.createNounPhrase("the engineer");
    engineer.addComplement(inner);
    
    // Outer clause is: 'the engineer' 'go' (preposition 'to' 'holidays')
    let outer = nlg.createClause(engineer,"go",nlg.createPrepositionPhrase("to","holidays"));

    // Outer clause tense is Future.
    outer.setFeature(Feature.TENSE, Tense.FUTURE);
    
    // Possibly progressive as well not sure.
    outer.setFeature(Feature.PROGRESSIVE,true);
    
    //Outer clause postmodifier would be 'tomorrow'
    outer.addPostModifier("tomorrow");
    let sentence = nlg.createSentence(outer);

    should(realiser.realise(sentence).getRealisation()).eql("The engineer whom I am making sentence for will be going to holidays tomorrow.");
    done();
  });

  /**
   * Tests the use of the Complementiser, Passive, Perfect features in past tense.
   */
  it("testComplementiserPassivePerfectFeatures_PastTense", (done) => {
    
    let inner = nlg.createClause("I", "play", "poker");
    inner.setFeature(Feature.TENSE,Tense.PAST);
    inner.setFeature(Feature.COMPLEMENTISER, "where");

    let house = nlg.createNounPhrase("the", "house");
    house.addComplement(inner);
    
    let outer = nlg.createClause(null, "abandon", house);

    outer.addPostModifier("since 1986");
    
    outer.setFeature(Feature.PASSIVE, true);
    outer.setFeature(Feature.PERFECT, true);
    
    let sentence = nlg.createSentence(outer);
    should(realiser.realise(sentence).getRealisation()).eql("The house where I played poker has been abandoned since 1986.");

    done();
  });
  
  /**
   * Tests the user of the progressive and complementiser featuers in past tense.
   */
  it("testProgressiveComplementiserFeatures_PastTense", (done) => {

    let sandwich = nlg.createNounPhrase(LexicalCategory.NOUN, "sandwich");
    sandwich.setPlural(true);
    // 
    let first = nlg.createClause("I", "make", sandwich);
    first.setFeature(Feature.TENSE,Tense.PAST);
    first.setFeature(Feature.PROGRESSIVE,true);
    first.setPlural(false);
    
    let second = nlg.createClause("the mayonnaise", "run out");
    second.setFeature(Feature.TENSE,Tense.PAST);
    second.setFeature(Feature.COMPLEMENTISER, "when");
    
    first.addComplement(second);
    
    let sentence = nlg.createSentence(first);
    
    should(realiser.realise(sentence).getRealisation()).eql("I was making sandwiches when the mayonnaise ran out.");
    done();
  });

  /**
   * Test the use of Passive in creating a Passive sentence structure: <Object> + [be] + <verb> + [by] + [Subject].
   */  
  it("testPassiveFeature", (done) => {
    let phrase = nlg.createClause("recession", "affect", "value");
    phrase.setFeature(Feature.PASSIVE, true);
    let sentence = nlg.createSentence(phrase);
    should(realiser.realise(sentence).getRealisation()).eql("Value is affected by recession.");

    done();
  });
});
