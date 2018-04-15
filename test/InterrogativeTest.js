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
import InterrogativeType from '../src/features/interrogativeType';

import LexicalCategory from '../src/features/LexicalCategory';

import mocha from 'mocha';
import should from 'should/as-function';

const lexicon = new Lexicon('small-lexicon.xml');
const nlg = new NLG(lexicon);
const realiser = new Realiser(lexicon);

describe('InterrogativeTest', () => { 

  it("testSimpleQuestions", (done) => {

    let woman = nlg.createNounPhrase("the", "woman");
    let man = nlg.createNounPhrase("the", "man");
    let dog = nlg.createNounPhrase("the", "dog");
    let boy = nlg.createNounPhrase("the", "boy");
    let kiss = nlg.createVerbPhrase("kiss");
    let give = nlg.createVerbPhrase("give");

    let onTheRock = nlg.createPrepositionPhrase("on");
    onTheRock.addComplement(nlg.createNounPhrase("the", "rock"));

    // simple present
    let s1 = nlg.createClause(woman, kiss, man);
    s1.setFeature(Feature.TENSE, Tense.PRESENT);
    s1.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);

    let sent = nlg.createSentence(s1);
    should(realiser.realise(sent).getRealisation()).eql("Does the woman kiss the man?");

    // simple past
    // sentence: "the woman kissed the man"
    s1 = nlg.createClause(woman, kiss, man);
    s1.setFeature(Feature.TENSE, Tense.PAST);
    s1.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(s1).getRealisation()).eql("did the woman kiss the man");

    // copular/existential: be-fronting
    // sentence = "there is the dog on the rock"
    let s2 = nlg.createClause("there", "be", dog); 
    s2.addPostModifier(onTheRock);
    s2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(s2).getRealisation()).eql("is there the dog on the rock");

    // perfective
    // sentence -- "there has been the dog on the rock"
    s2 = nlg.createClause("there", "be", dog); 
    s2.addPostModifier(onTheRock);
    s2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    s2.setFeature(Feature.PERFECT, true);
    should(realiser.realise(s2).getRealisation()).eql("has there been the dog on the rock");

    // progressive
    // sentence: "the man was giving the woman John's flower"
    let john = nlg.createNounPhrase("John"); 
    john.setFeature(Feature.POSSESSIVE, true);
    let flower = nlg.createNounPhrase(john, "flower"); 
    let _woman = nlg.createNounPhrase("the", "woman");
    let s3 = nlg.createClause(man, give, flower);
    s3.setIndirectObject(_woman);
    s3.setFeature(Feature.TENSE, Tense.PAST);
    s3.setFeature(Feature.PROGRESSIVE, true);
    s3.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(s3).getRealisation()).eql("was the man giving the woman John's flower");

    // complex case with cue phrases
    // sentence: "however, tomorrow, Jane and Andrew will pick up the balls
    // in the shop"
    // this gets the front modifier "tomorrow" shifted to the end
    let subjects = new CoordinatedPhraseElement(nlg.createNounPhrase("Jane"), nlg.createNounPhrase("Andrew")); 
    let s4 = nlg.createClause(subjects, "pick up", "the balls"); 
    s4.addPostModifier("in the shop"); 
    s4.setFeature(Feature.CUE_PHRASE, "however,"); 
    s4.addFrontModifier("tomorrow"); 
    s4.setFeature(Feature.TENSE, Tense.FUTURE);
    s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(s4).getRealisation()).eql("however, will Jane and Andrew pick up the balls in the shop tomorrow");
    
    done();
  });

  it("testSimpleQuestions more", (done) => {
    // modal
    // sentence: "the man should be giving the woman John's flower"
    let man = nlg.createNounPhrase("the", "man");
    let john = nlg.createNounPhrase("John"); 
    let give = nlg.createVerbPhrase("give");

    john.setFeature(Feature.POSSESSIVE, true);
    let flower = nlg.createNounPhrase(john, "flower"); 
    let _woman = nlg.createNounPhrase("the", "woman"); 
    let s3 = nlg.createClause(man, give, flower);
    s3.setIndirectObject(_woman);
    s3.setFeature(Feature.TENSE, Tense.PAST);
    s3.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    s3.setFeature(Feature.MODAL, "should");
    should(realiser.realise(s3).getRealisation()).eql("should the man have given the woman John's flower");

    done();
  });

  it("testNegatedQuestions", (done) => {

    let woman = nlg.createNounPhrase("the", "woman");
    let man = nlg.createNounPhrase("the", "man");

    // sentence: "the woman did not kiss the man"
    let s1 = nlg.createClause(woman, "kiss", man);
    s1.setFeature(Feature.TENSE, Tense.PAST);
    s1.setFeature(Feature.NEGATED, true);
    s1.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(s1).getRealisation()).eql("did the woman not kiss the man");

    // sentence: however, tomorrow, Jane and Andrew will not pick up the
    // balls in the shop
    let subjects = new CoordinatedPhraseElement(nlg.createNounPhrase("Jane"), nlg.createNounPhrase("Andrew"));
    let s4 = nlg.createClause(subjects, "pick up", "the balls");
    s4.addPostModifier("in the shop");
    s4.setFeature(Feature.CUE_PHRASE, "however,");
    s4.addFrontModifier("tomorrow");
    s4.setFeature(Feature.NEGATED, true);
    s4.setFeature(Feature.TENSE, Tense.FUTURE);
    s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(s4).getRealisation()).eql("however, will Jane and Andrew not pick up the balls in the shop tomorrow");

    done();
  });

  /**
   * Tests for coordinate VPs in question form.
   */
  it.skip("testCoordinateVPQuestions", (done) => {
  
    let inTheRoom = nlg.createPrepositionPhrase("in");
    inTheRoom.addComplement(nlg.createNounPhrase("the", "room"));
    let dog = nlg.createNounPhrase("the", "dog");

    // create a complex vp: "kiss the dog and walk in the room"
    let kiss = nlg.createVerbPhrase("kiss");
    let walk = nlg.createVerbPhrase("walk");
    let complex = new CoordinatedPhraseElement(kiss, walk);
    kiss.addComplement(dog);
    walk.addComplement(inTheRoom);

    // sentence: "However, tomorrow, Jane and Andrew will kiss the dog and will walk in the room"
    var subjects = new CoordinatedPhraseElement(nlg.createNounPhrase("Jane"), nlg.createNounPhrase("Andrew"));
    var s4 = nlg.createClause(subjects, complex);
    s4.setFeature(Feature.CUE_PHRASE, "however");
    s4.addFrontModifier("tomorrow");
    s4.setFeature(Feature.TENSE, Tense.FUTURE);

    should(realiser.realise(s4).getRealisation()).eql("however tomorrow Jane and Andrew will kiss the dog and will walk in the room");

    // // setting to interrogative should automatically give us a single, wide-scope aux
    // complex = new CoordinatedPhraseElement(kiss, walk);
    // var s4 = nlg.createClause(subjects, complex);
    // s4.setFeature(Feature.CUE_PHRASE, "however");
    // s4.addFrontModifier("tomorrow");
    // s4.setFeature(Feature.TENSE, Tense.FUTURE);
    // s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);

    // should(realiser.realise(s4).getRealisation()).eql("however will Jane and Andrew kiss the dog and walk in the room tomorrow");

    // // slightly more complex -- perfective
    // subjects = new CoordinatedPhraseElement(nlg.createNounPhrase("Jane"), nlg.createNounPhrase("Andrew"));
    // complex = new CoordinatedPhraseElement(kiss, walk);
    // kiss.addComplement(dog);
    // walk.addComplement(inTheRoom);
    // s4 = nlg.createClause(subjects, complex);
    // s4.setFeature(Feature.CUE_PHRASE, "however");
    // s4.addFrontModifier("tomorrow");
    // s4.setFeature(Feature.TENSE, Tense.FUTURE);
    // s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    // s4.setFeature(Feature.PERFECT, true);

    // should(realiser.realise(s4).getRealisation()).eql("however will Jane and Andrew have kissed the dog and walked in the room tomorrow");
    done();
  });

  /**
   * Test for simple WH questions in present tense.
   */
  it("testSimpleQuestions2", (done) => {
  
    let s = nlg.createClause("the woman", "kiss", "the man");

    // try with the simple yes/no type first
    s.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(s).getRealisation()).eql("does the woman kiss the man");

    // now in the passive
    s.setFeature(Feature.PASSIVE, true);
    should(realiser.realise(s).getRealisation()).eql("is the man kissed by the woman");

    // subject interrogative with simple present
    // sentence: "the woman kisses the man"
    s = nlg.createClause("the woman", "kiss", "the man");
    s.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);

    should(realiser.realise(s).getRealisation()).eql("who kisses the man");

    // object interrogative with simple present
    s = nlg.createClause("the woman", "kiss", "the man");
    s.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_OBJECT);
    should(realiser.realise(s).getRealisation()).eql("who does the woman kiss");

    // subject interrogative with passive
    s = nlg.createClause("the woman", "kiss", "the man");
    s.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    s.setFeature(Feature.PASSIVE, true);
    should(realiser.realise(s).getRealisation()).eql("who is the man kissed by");

    done();
  });

  /**
   * Test for wh questions.
   */
  it("testWHQuestions", (done) => {

    let subjects = new CoordinatedPhraseElement(nlg.createNounPhrase("Jane"), nlg.createNounPhrase("Andrew"));
    var s4 = nlg.createClause(subjects, "pick up", "the balls");
    s4.addPostModifier("in the shop");
    s4.setFeature(Feature.CUE_PHRASE, "however");
    s4.addFrontModifier("tomorrow");
    s4.setFeature(Feature.TENSE, Tense.FUTURE);

    // subject interrogative
    s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    should(realiser.realise(s4).getRealisation()).eql("however who will pick up the balls in the shop tomorrow");

    // subject interrogative in passive
    s4.setFeature(Feature.PASSIVE, true);
    should(realiser.realise(s4).getRealisation()).eql("however who will the balls be picked up in the shop by tomorrow");

    // object interrogative
    var s4 = nlg.createClause(subjects, "pick up", "the balls");
    s4.addPostModifier("in the shop");
    s4.setFeature(Feature.CUE_PHRASE, "however");
    s4.addFrontModifier("tomorrow");
    s4.setFeature(Feature.TENSE, Tense.FUTURE);
    s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(s4).getRealisation()).eql("however what will Jane and Andrew pick up in the shop tomorrow");

    // object interrogative with passive
    s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    s4.setFeature(Feature.PASSIVE, true);
    should(realiser.realise(s4).getRealisation()).eql("however what will be picked up in the shop by Jane and Andrew tomorrow");

    // how-question + passive
    s4.setFeature(Feature.PASSIVE, true);
    s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.HOW);
    should(realiser.realise(s4).getRealisation()).eql("however how will the balls be picked up in the shop by Jane and Andrew tomorrow");

    // why-question + passive
    s4.setFeature(Feature.PASSIVE, true);
    s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHY);
    should(realiser.realise(s4).getRealisation()).eql("however why will the balls be picked up in the shop by Jane and Andrew tomorrow");

    // how question with modal
    s4.setFeature(Feature.PASSIVE, true);
    s4.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.HOW);
    s4.setFeature(Feature.MODAL, "should");
    should(realiser.realise(s4).getRealisation()).eql("however how should the balls be picked up in the shop by Jane and Andrew tomorrow");


    let john = nlg.createNounPhrase("John");
    let man = nlg.createNounPhrase("the", "man");
    let give = nlg.createVerbPhrase("give");
    john.setFeature(Feature.POSSESSIVE, true);
    let flower = nlg.createNounPhrase(john, "flower");
    let _woman = nlg.createNounPhrase("the", "woman");
    let s3 = nlg.createClause(man, give, flower);
    s3.setIndirectObject(_woman);

    // indirect object
    s3.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_INDIRECT_OBJECT);
    should(realiser.realise(s3).getRealisation()).eql("who does the man give John's flower to");

    done();
  });

  /**
   * WH movement in the progressive
   */
  it("testProgrssiveWHSubjectQuestions", (done) => {
    let p = nlg.createClause();
    p.setSubject("Mary");
    p.setVerb("eat");
    p.setObject(nlg.createNounPhrase("the", "pie"));
    p.setFeature(Feature.PROGRESSIVE, true);
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("who is eating the pie");
    done();
  });

  /**
   * WH movement in the progressive
   */
  it("testProgrssiveWHObjectQuestions", (done) => {
  
    let p = nlg.createClause();
    p.setSubject("Mary");
    p.setVerb("eat");
    p.setObject(nlg.createNounPhrase("the", "pie"));
    p.setFeature(Feature.PROGRESSIVE, true);
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what is Mary eating");

    // AG -- need to check this; it doesn't work
    // p.setFeature(Feature.NEGATED, true);
    //    Assert.assertEquals("what is Mary not eating",
    // realiser.realise(p).getRealisation());
    done();
  });

  /**
   * Negation with WH movement for subject
   */
  it("testNegatedWHSubjQuestions", (done) => {
    let p = nlg.createClause();
    p.setSubject("Mary");
    p.setVerb("eat");
    p.setObject(nlg.createNounPhrase("the", "pie"));
    p.setFeature(Feature.NEGATED, true);
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("who does not eat the pie");
    done();
  });

  /**
   * Negation with WH movement for object
   */
  it("testNegatedWHObjQuestions", (done) => {
  
    let p = nlg.createClause();
    p.setSubject("Mary");
    p.setVerb("eat");
    p.setObject(nlg.createNounPhrase("the", "pie"));
    p.setFeature(Feature.NEGATED, true);

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what does Mary not eat");
    done();
  });

  /**
   * Test questyions in the tutorial.
   */
  it("testTutorialQuestions", (done) => {
    let p = nlg.createClause("Mary", "chase", "George");
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);

    should(realiser.realise(p).getRealisation()).eql("does Mary chase George");

    p = nlg.createClause("Mary", "chase", "George");
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("who does Mary chase");
    done();
  });

  /**
   * Subject WH Questions with modals
   */
  it("testModalWHSubjectQuestion", (done) => {
    let man = nlg.createNounPhrase("the", "man");
    let dog = nlg.createNounPhrase("the", "dog");
    let p = nlg.createClause(dog, "upset", man);
    p.setFeature(Feature.TENSE, Tense.PAST);
    should(realiser.realise(p).getRealisation()).eql("the dog upset the man");

    // first without modal
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("who upset the man");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("what upset the man");

    // now with modal auxiliary
    p.setFeature(Feature.MODAL, "may");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("who may have upset the man");

    p.setFeature(Feature.TENSE, Tense.FUTURE);
    should(realiser.realise(p).getRealisation()).eql("who may upset the man");

    p.setFeature(Feature.TENSE, Tense.PAST);
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("what may have upset the man");

    p.setFeature(Feature.TENSE, Tense.FUTURE);
    should(realiser.realise(p).getRealisation()).eql("what may upset the man");
    done();
  });

  /**
   * Subject WH Questions with modals
   */
  it("testModalWHObjectQuestion", (done) => {
    let man = nlg.createNounPhrase("the", "man");
    let dog = nlg.createNounPhrase("the", "dog");
    let p = nlg.createClause(dog, "upset", man);
    p.setFeature(Feature.TENSE, Tense.PAST);
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_OBJECT);

    should(realiser.realise(p).getRealisation()).eql("who did the dog upset");

    p.setFeature(Feature.MODAL, "may");
    should(realiser.realise(p).getRealisation()).eql("who may the dog have upset");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what may the dog have upset");

    p.setFeature(Feature.TENSE, Tense.FUTURE);
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("who may the dog upset");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what may the dog upset");
    done();
  });

  /**
   * Questions with tenses requiring auxiliaries + subject WH
   */
  it("testAuxWHSubjectQuestion", (done) => {
    let man = nlg.createNounPhrase("the", "man");
    let dog = nlg.createNounPhrase("the", "dog");
    let p = nlg.createClause(dog, "upset", man);
    p.setFeature(Feature.TENSE, Tense.PRESENT);
    p.setFeature(Feature.PERFECT, true);
    should(realiser.realise(p).getRealisation()).eql("the dog has upset the man");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("who has upset the man");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("what has upset the man");
    done();
  });

  /**
   * Questions with tenses requiring auxiliaries + subject WH
   */
  it("testAuxWHObjectQuestion", (done) => {
    let man = nlg.createNounPhrase("the", "man");
    let dog = nlg.createNounPhrase("the", "dog");
    let p = nlg.createClause(dog, "upset", man);

    // first without any aux
    p.setFeature(Feature.TENSE, Tense.PAST);
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what did the dog upset");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("who did the dog upset");

    p.setFeature(Feature.TENSE, Tense.PRESENT);
    p.setFeature(Feature.PERFECT, true);

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("who has the dog upset");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what has the dog upset");

    p.setFeature(Feature.TENSE, Tense.FUTURE);
    p.setFeature(Feature.PERFECT, true);

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("who will the dog have upset");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what will the dog have upset");
    done();
  });

  /**
   * Test for questions with "be"
   */
  it("testBeQuestions", (done) => {
  
    let p = nlg.createClause(
        nlg.createNounPhrase("a", "ball"),
        nlg.createWord("be", LexicalCategory.VERB),
        nlg.createNounPhrase("a", "toy"));

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what is a ball");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(p).getRealisation()).eql("is a ball a toy");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("what is a toy");

    let p2 = nlg.createClause("Mary", "be", "beautiful");
    p2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHY);
    should(realiser.realise(p2).getRealisation()).eql("why is Mary beautiful");
    
    p2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHERE);
    should(realiser.realise(p2).getRealisation()).eql("where is Mary beautiful");
    
    p2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    should(realiser.realise(p2).getRealisation()).eql("who is beautiful");

    done();        
  });

  /**
   * Test for questions with "be" in future tense
   */
  it("testBeQuestionsFuture", (done) => {
  
    let p = nlg.createClause(
        nlg.createNounPhrase("a", "ball"),
        nlg.createWord("be", LexicalCategory.VERB),
        nlg.createNounPhrase("a", "toy"));
    p.setFeature(Feature.TENSE, Tense.FUTURE);

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what will a ball be");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(p).getRealisation()).eql("will a ball be a toy");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("what will be a toy");

    let p2 = nlg.createClause("Mary", "be", "beautiful");
    p2.setFeature(Feature.TENSE, Tense.FUTURE);
    p2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHY);
    should(realiser.realise(p2).getRealisation()).eql("why will Mary be beautiful");

    p2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHERE);
    should(realiser.realise(p2).getRealisation()).eql("where will Mary be beautiful");
    
    p2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    should(realiser.realise(p2).getRealisation()).eql("who will be beautiful");
    
    done();
  });

  /**
   * Tests for WH questions with be in past tense
   */

  it("testBeQuestionsPast", (done) => {
  
    let p = nlg.createClause(
        nlg.createNounPhrase("a", "ball"),
        nlg.createWord("be", LexicalCategory.VERB),
        nlg.createNounPhrase("a", "toy"));
    p.setFeature(Feature.TENSE, Tense.PAST);

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_OBJECT);
    should(realiser.realise(p).getRealisation()).eql("what was a ball");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.YES_NO);
    should(realiser.realise(p).getRealisation()).eql("was a ball a toy");

    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHAT_SUBJECT);
    should(realiser.realise(p).getRealisation()).eql("what was a toy");

    let p2 = nlg.createClause("Mary", "be", "beautiful");
    p2.setFeature(Feature.TENSE, Tense.PAST);
    p2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHY);
    should(realiser.realise(p2).getRealisation()).eql("why was Mary beautiful");
    
    p2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHERE);
    should(realiser.realise(p2).getRealisation()).eql("where was Mary beautiful");

    p2.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHO_SUBJECT);
    should(realiser.realise(p2).getRealisation()).eql("who was beautiful");

    done();
  });


  /**
   * Test WHERE, HOW and WHY questions, with copular predicate "be"
   */
  it("testSimpleBeWHQuestions", (done) => {

    let p = nlg.createClause("I", "be");
    
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHERE);  
    should(realiser.realiseSentence(p)).eql("Where am I?");
    
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.WHY);
    should(realiser.realiseSentence(p)).eql("Why am I?");
    
    p.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.HOW);
    should(realiser.realiseSentence(p)).eql("How am I?");
  
    done();
  });

  /*
   * Test a simple "how" question, based on query from Albi Oxa
   */
  it("testHowPredicateQuestion", (done) => {
    let test = nlg.createClause();
    let subject = nlg.createNounPhrase("You");

    subject.setFeature(Feature.PRONOMINAL, true);
    subject.setFeature(Feature.PERSON, Person.SECOND);
    test.setSubject(subject);
    test.setVerb("be");

    test.setFeature(Feature.INTERROGATIVE_TYPE, InterrogativeType.HOW_PREDICATE);
    test.setFeature(Feature.TENSE, Tense.PRESENT);

    should(realiser.realiseSentence(test)).eql("How are you?");    
    done();
  });

});
