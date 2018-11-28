/**
 * Represents a conversation. Stores the conversation stage,
 * order, reservation, feedback, and restaurant info.
 * 
 * Conversation stages are denoted in ABC format (integer):
 * A = primary stage, B = secondary stage, C = progress stage
 * A = {1,2,3,9}      B = {0,1,2,3}        C = {1,2,3,9}
 * Note: B is set as 0 when A is not equal to 2
 * A = 1: greeting
 *     2: ordering / reservation / info / feedback
 *     3: confirmation
 *     9: completed
 * B = 0: making order
 *     1: making reservation
 *     2: request restaurant info
 *     3: recording feedback
 * C = 1: determining main attribute (food type for order)
 *     2: determining additional info (onions, cheese, etc.)
 *     3: dish / reservation confirmation
 *     9: ask if anything else
 * all valid_stages = new Set([
 *     101, 102,            // greeting
 *     201, 202, 203, 209,  // ordering
 *     211, 212, 213, 219,  // reservation
 *     221, 222, 223, 229,  // info
 *     231, 232, 233, 239,  // feedback
 *     301, 302,            // confirmation
 *     999])                // completed
 */


// IMPORTS:
// Data Modules
const _restaurant_data_module = require('./info_restaurant')
const _order_data_module = require('./info_order')
const _reservation_data_module = require('./info_reservation')
const _feedback_data_module = require('./info_feedback')
// Response Modules
const _order_resp_module = require('./resp_order')
const _reservation_resp_module = require('./resp_reservation')
const _feedback_resp_module = require('./resp_feedback')
const _restaurant_resp_module = require('./resp_restaurant')
// Random Array Picker
const randomArrayPicker = require('./random_picker')


// MACROS:
// WIT.AI MACROS
const ORDER = "order"
const RESERVE = "make_reservation"
const INFO_REQ = "info_request"
const FEEDBACK = "feedback"
const YN_LIST = "conversationEnd"
const YES = "yes"
const NO = "no"
// RESP_MACROS
const ORDER_CONFIRM = [
    // Do not forget the ending whitespace
    // followed by Order.curstomerReport()
    "Please confirm your order: ",
    "Your order is: ",
    "Here is your order: ",
    "Let me reiterate your order: "
]
const APPEND_CONFIRM = [
    // Do not forget the starting whitespace
    // preceded by Order.customerReport()
    " Is that right?",
    " Would that be right?",
    " Everything correct?"
]
const SPECIAL_INST = [
    "Do you need any sauces? More ketchup packets?",
    "Need any sauces? Or more ketchup packets?"
]
const ORDER_FINISHED = [
    "Thank you so much! Your order is now finished!",
    "Thank you for chatting with me! Your order is finished!",
    "Thank you! Your order is finished!",
    "Thanks! Your order is finished!"
]
const BOT_CONFUSED = [
    "I'm so sorry. But I don't understand.",
    "Beep boop, I am a bot.",
    "Sorry, I am confused.",
    "Sorry, I didn't get that."
]


class Conversation {
    /** Handles the interaction between messages and index.js
     *  @param {integer} this.stage:
     *      class variable that stores the stage of the conversation.
     *  @param {integer} this._id:
     *      order id
     *  @param {object} this._restaurant:
     *      Restaurant class object (info_restaurant.js)
     *  @param {object} this._order:
     *      Order class object (info_order.js)
     *  @param {integer} this._dishno:
     *      Current dish index for this._order.dishlist
     *  @param {object} this._reservation:
     *      Reservation class object (info_reservation.js)
     *  @param {object} this._feedback:
     *      Feedback class object (info_feedback.js)
     */

    constructor() {
        this.stage = 101
        this._id = Math.floor(Math.random()*1000000)
        this._restaurant = new _restaurant_data_module()
        this._order = new _order_data_module()
        this._dishno = 0
        this._reservation = new _reservation_data_module()
        this._feedback = new _feedback_data_module()
        this._multiple_dish_flag = false
        this._bot_confused = false
    }

    print() {
        /* Developer use:
         * Returns conversation id and its stage
         */
        return "Order id: " + String(this._id)
               + " at stage " + String(this.stage) + "."
    }

    converse(json_sentence) {
        /**
         * conversation:
         * public wrapper for this._converse()
         * 
         * @param {Json} json_sentence:
         *      Parsed sentence map generated by Wit.AI.
         * @return {(Integer, String)}:
         *      Status code and the response text from _converse().
         *      Will return status code -1 if this.stage == 999.
         */
        // console.log("success!!!")
        if (this.stage == 999) {
            return (-1, "")
        } else {
            return this._converse(json_sentence)
        }
    }

    _converse(recv) {
        /**
         * conversation:
         * 1. Understanding what the customer wants, and
         *    set the stage to the appropriate value.
         * 2. Generating response and return status code and
         *    response text.
         * 
         * @param {Map} recv:
         *      Map containing info from a parsed sentence.
         * @return {(Integer, String)}:
         *      Status code and the response text.
         */
        var res = 0
        var primary_stage = Math.floor(this.stage / 100)
        if (primary_stage == 1) {
            res = this._converse_ps1(recv)
        } else if (primary_stage == 2) {
            res = this._converse_ps2(recv)
        } else if (primary_stage == 3) {
            res = this._converse_ps3(recv)
        } else {
            console.log("ERROR: In _converse(), invalid primary stage number " + 
                        + toString(primary_stage) + ".")
            this._bot_confused == true
        }
        if (res != 0) {
            console.log("ERROR: In _converse(), at stage " + String(this.stage))
            console.log("ERROR: converse_ps functions return non-zero.")
            this._bot_confused == true
        }
        if (this._bot_confused == true) {
            this._bot_confused = false
            return 1, randomArrayPicker(BOT_CONFUSED)
        }
        primary_stage = Math.floor(this.stage / 100)
        var text = ""
        if (primary_stage == 1) {
            res, text = this._response_ps1(recv)
        } else if (primary_stage == 2) {
            res, text = this._response_ps2(recv)
        } else if (primary_stage == 3) {
            res, text = this._response_ps3(recv)
        } else if (primary_stage == 9) {
            return -1, randomArrayPicker(ORDER_FINISHED)
        } else {
            console.log("ERROR: In _converse(), invalid primary stage number.")
            return 1, text
        }
        if (res != 0) {
            console.log("ERROR: In _converse(), at stage " + String(this.stage))
            console.log("ERROR: response_ps functions return non-zero.")
            return 1, text
        }
        return 0, text
    }

    _converse_ps1(recv) {
        if (ORDER in recv) {
            // Make order (201 - 203, 209)
            // 201 = Require food type
            // 202 = Require additional info
            // 203 = Require confirmation (REMOVED)
            var res = 0
            res = this._order.addFill(recv)
            if (res == 1) {
                this.stage = 201
                return 0
            }
            res = this._order.whatIsNotFilled()
            if (res != (this._dishno, 0)) {
                this.stage = 202
                return 0
            } else {
                this.stage = 209
                return 0
            }
        } else if (RESERVE in recv) {
            // Make reservation (211 - 213, 219)
            // 212 = Require additional info
            // 213 = Require confirmation
            this._reservation.fill(recv)
            var res = this._reservation.whatIsNotFilled()
            if (res != 0) {
                this.stage = 212
            } else {
                this.stage = 213
            }
            return 0
        } else if (INFO_REQ in recv) {
            // Request restaurant info (229)
            // 229 = Response and ask for more questions
            this.stage = 229
            return 0
        } else if (FEEDBACK in recv) {
            // Make feedback (231 - 233, 239)
            // 232 = Require additional info (rating)
            // 239 = Ask if anything else
            this._feedback.fill(recv)
            if (this._feedback.rating == null) {
                this.stage = 232
            } else {
                this.stage = 239
            }
            return 0
        } else {
            // Bot is confused, stage stays at 101
            this._bot_confused = true
            return 0
        }
    }

    _converse_ps2(recv) {
        var secondary_stage = Math.floor(this.stage / 10) % 10
        var progress_stage = this.stage % 10
        if (secondary_stage == 0) {
            // Make order (201 - 203, 209)
            // 201 = Require food type
            // 202 = Require additional info
            // 203 = Require confirmation (REMOVED!)
            // 209 = Ask for more dishes
            if (progress_stage == 1) {
                var res = 0
                res = this._order.addFill(recv)
                if (res == 1) {
                    this._bot_confused = true
                    return 0
                }
                res = this._order.whatIsNotFilled()
                if (res != (this._dishno, 0)) {
                    this.stage = 202
                } else {
                    this.stage = 209
                }
                return 0
            } else if (progress_stage == 2) {
                this._order.fill(this._dishno, recv)
                var res = this._order.whatIsNotFilled()
                if (res == (this._dishno, 0)) {
                    this.stage = 209
                }
                return 0
            } else if (progress_stage == 9) {
                var yn = this._yn_parsing(recv)
                if (yn == 0) {
                    this.stage = 301
                } else if (yn == 1) {
                    this._multiple_dish_flag = true
                    this._dishno = this._dishno + 1
                    this.stage = 201
                } else {
                    // BOT CONFUSED
                    this._bot_confused = true
                    return 0
                }
                return 0
            }
        } else if (secondary_stage == 1) {
            // Make reservation (211 - 213, 219)
            // 212 = Require additional info
            // 213 = Require confirmation
            // 209 = Ask if anything else
            this._reservation.fill(recv)
            var res = this._reservation.whatIsNotFilled()
            if (res != 0) {
                this.stage = 212
            } else {
                this.stage = 213
            }
            return 0
        } else if (secondary_stage == 2) {
            // Request restaurant info (221 - 223, 229)
            // No need to do anything here
            return 0
        } else if (secondary_stage == 3) {
            // Make feedback (231 - 233, 239)
            // Try to fill additional info (rating)
            this._feedback.fill(recv)
            this.stage = 239
            return 0
        } else {
            // BOT CONFUSED
            this._bot_confused = true
            return 0
        }
    }

    _converse_ps3(recv) {
        var progress_stage = this.stage % 10
        if (progress_stage == 1) {
            // TODO: change order
            var yn = this._yn_parsing(recv)
            if (yn == 1) {
                this.stage = 302
            } else if (yn == 0) {
                this.stage = 301
            } else {
                // BOT CONFUSED
                this._bot_confused = true
            }
            return 0
        } else if (progress_stage == 2) {
            // TODO: special instructions, do not need to confirm
            var yn = this._yn_parsing(recv)
            if (yn == 0) {
                this.stage = 999
            } else if (yn == 1) {
                this.stage = 999
            } else {
                // BOT CONFUSED
                this._bot_confused = true
            }
            return 0
        } else {
            // Bot is confused, stage stays at the current stage
            this._bot_confused = true
            return 0
        }
    }

    _response_ps1() {
        return 0
    }

    _response_ps2(recv) {
        var secondary_stage = Math.floor(this.stage / 10) % 10
        var progress_stage = this.stage % 10
        if (secondary_stage == 0) {
            var res = 0, text = null
            // Input flow control
            if (progress_stage != 1) {
                res, text =  _order_resp_module(
                    progress_stage,
                    this._multiple_dish_flag,
                    this._order.dishlist[this._dishno].whatIsNotFilled()
                )
            } else {
                res, text =  _order_resp_module(
                    progress_stage,
                    this._multiple_dish_flag,
                    1
                )
            }
            // Output flow control
            if (progress_stage != 3) {
                return res, text
            } else {
                text = text +
                       this._order.dishlist[this._dishno].customerReport() +
                       randomArrayPicker(APPEND_CONFIRM)
                return res, text
            }
        } else if (secondary_stage == 1) {
            return _reservation_resp_module(
                this._reservation.whatIsNotFilled()
            )
        } else if (secondary_stage == 2) {
            return _restaurant_resp_module(
                recv
            )
        } else if (secondary_stage == 3) {
            return _feedback_resp_module(
                progress_stage
            )
        }
    }

    _response_ps3(recv) {
        var progress_stage = this.stage % 10
        if (progress_stage == 1) {
            return 0, randomArrayPicker(ORDER_CONFIRM) +
                      this._order.customerReport()
        } else if (progress_stage == 2) {
            return 0, randomArrayPicker(SPECIAL_INST)
        }
    }

    _yn_parsing(recv) {
        if (YN_LIST in recv) {
            if (recv.conversationEnd[0].value == YES) {
                return 1
            } else if (recv.conversationEnd[0].value == NO) {
                return 0
            } else {
                console.log("ERROR: In _yn_parsing(), cannot parse value " + 
                            recv.conversationEnd[0].value)
                return -1
            }
        } else {
            console.log("ERROR: In _yn_parsing, conversationEnd not in recv")
            return -1
        }
    }

    renew() {
        return new Conversation();
    }
}


module.exports = new Conversation()

