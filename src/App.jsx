import React from "react";
import "./App.css";
import { AddRequestForm, RequestList } from './components/ServiceRequest'
import Nav from './components/Navbar'
import Landing from './components/Landing'
import RequestChart from "./components/Chart";
import {
  Routes,
  Route
} from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";
function App() {

  const [session, setSession] = useState(null);
  const [requests, setRequests] = useState([]);

  // TO DO - Create setup for managing sessions. Check out the supabase quickstart guides to get idea about this. 
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("spam fix?")
      setSession(session)

      //given in hw3 notes
      const {data, error} = await supabase.from("service_request").select().eq('accept_reject', false) //grab not completed requests
      let newRequestsData = []
      data.forEach((item) => newRequestsData.push({ name: item.name, sdescription: item.short_desc, ldescription: item.long_desc, id: item.id, email: item.email, isCompleted: item.accept_reject }))
      setRequests(newRequestsData)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

   // TO DO - Setup listener for supabase realtime API for updates to the service requests 
  // For example , if any of the service request is completed then this should invoke this realtime API which inturn should update the list of requests
  useEffect(() => {
    // code given in hw details, and .on.subscribe from supabase API docs

    supabase
    .channel('*')
    .on('postgres_changes', { event: '*', schema: '*' }, async payload => {
      const {data, error} = await supabase.from("service_request").select().eq('accept_reject', false) 
      let newRequestsData = []
      data.forEach((item) => newRequestsData.push({ name: item.name, sdescription: item.short_desc, ldescription: item.long_desc, id: item.id, email: item.email, isCompleted: item.accept_reject }))
      setRequests(newRequestsData)
    }).subscribe()
    })
  const addRequest = async (element) => {
    //let request_id = 1 //thought i had to track id for table
    console.log(element)
    console.log(session)
    console.log(session.user)
    //element.name, sdescription, email, ldescription
    //for supabase...add uid(session.id), ID, accept-reject = false, created @ time
    const newRequests = [...requests, element];
    // TO DO 
    // Call the supabase API to add the new service request (initially the accept_reject should be 'false' to indicate the service request is yet to completed by an admin).
      // When you will insert the a service request record you will also have to provide the "user_id". This is a field which maps which user created the service request.
      // For getting this you can make use of supabase.auth.getSession(). The will return a json containing information about the authenticated user
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    const { data, error} = await supabase.from('service_request')
    .insert([
        { user_id: sessionData.session.user.id, email: element.email, short_desc: element.sdescription,
          long_desc: element.ldescription, name: element.name, accept_reject: false},
      ])
    // If this API call succeeds add the element to the list of requests with setRequests  
    setRequests(newRequests);
  };

  const completeRequest = async (index, serviceId = 0) => {
    const newRequests = [...requests];
    // TO DO
    // Call the supabase API to update the service request as completed (i.e. the accept_reject flag database column will become 'true' now).
    // If this API call succeeds update the element to the list of requests with setRequests
    const { data, error } = await supabase
  .from('service_request')
  .update({ accept_reject: true })
  .eq('id', serviceId)
    newRequests[index].isCompleted = true;
    setRequests(newRequests);
  };

  const removeRequest = async (index, serviceId = 0) => {
    const newRequests = [...requests];
    // TO DO
    // Call the supabase API to remove / delete the service request .
    const { data, error } = await supabase
      .from('service_request')
      .delete()
      .eq('id', serviceId)
    // If this API call succeeds remove the element from the list of requests with setRequests  
    newRequests.splice(index, 1);
    setRequests(newRequests);
  };

  return (
    <>
      <Nav session={session} setSession={setSession}/>
      <Routes>
        {/* Allow only authenticated user to proceed to RequestList, AddRequestForm, RequestChart else Navigate to landing component */}
        <Route path="/" element={<Landing />} />
        <Route path="/list" element={<RequestList completeRequest={completeRequest} removeRequest={removeRequest} requests={requests} />} />
        <Route path="/add" element={<AddRequestForm addRequest={addRequest} />} />
        <Route path="/chart" element={<RequestChart requests={requests} />} />
      </Routes>
    </>
  );
}

export default App;