package main

import "fmt"
import "net/http"
import "log"
import "time"

func main() {
	http.Handle("/", http.FileServer(http.Dir("./public")))
	// Register the handler on DefaultServeMux
	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello World\n"))
	})
	http.HandleFunc("/profile", func(w http.ResponseWriter, r *http.Request) {
		log.Println("/profile")

		// Use type assertion to make sure the ResponseWriter
		// implements the Flusher interface
		flusher, ok := w.(http.Flusher)

		if !ok {
			http.Error(w, "Streaming Not Supported!", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		messageChan := make(chan []byte)

		ticker := time.NewTicker(time.Millisecond * 2000)
		go func() {
			for t := range ticker.C {
				msg := t.String()
				messageChan <- []byte(msg)
			}
		}()

		for {
			// Block until there is a message
			fmt.Fprintf(w, "data: %s\n\n", <-messageChan)
			flusher.Flush()
		}
	})
	//Serve request using the DefaltServeMux
	log.Println("Listening....")
	log.Fatal(http.ListenAndServe(":9000", nil))
}
