import { useDispatch } from "react-redux";
/**
 * This hook will dispatch actions and update the store.
 *
 * This function will returns a function which accepts
 * ACTION_TYPE as first argument and
 * PAYLOAD  as second argument.
 *
 * @return {Function} Function (ACTION_TYPE, Payload)
 * @example
 *        const dispatchAction = useActionDispatcher();
 *        dispatchAction(SET_KEYS_TRUE, { keys: ["isLawyer", "showLogin"] });
 *
 */
const useActionDispatcher = () => {
  const dispatch = useDispatch();
  return (type, payload) => {
    dispatch({
      type,
      payload,
    });
  };
};

export default useActionDispatcher;
